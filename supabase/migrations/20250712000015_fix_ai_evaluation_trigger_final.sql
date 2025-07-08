-- Migration: Fix AI evaluation trigger with proper URL construction and Edge Function call
-- This migration creates a working trigger that properly calls the ai-candidate-evaluation Edge Function

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_candidate_completion_ai_evaluation ON candidates;
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation_completion();
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a new trigger function that properly calls the Edge Function
CREATE OR REPLACE FUNCTION trigger_ai_evaluation_completion()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  response_id BIGINT;
  project_ref TEXT;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
    ) THEN
      
      -- Log that candidate is ready for processing
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'triggering_edge_function',
        'Candidate interview completed, triggering AI evaluation via Edge Function',
        NEW.id,
        NEW.job_id,
        NOW()
      );
      
      -- Get the project reference (same pattern as original migration)
      project_ref := current_setting('app.settings.supabase_project_ref', true);
      
      -- Construct the Edge Function URL using the project reference
      function_url := 'https://' || project_ref || '.supabase.co/functions/v1/ai-candidate-evaluation';
      
      -- Prepare payload for the Edge Function (same structure as original)
      request_payload := jsonb_build_object(
        'candidateId', NEW.id,
        'jobId', NEW.job_id,
        'profileId', (
          SELECT profile_id 
          FROM jobs 
          WHERE id = NEW.job_id
        )
      );
      
      -- Call the Edge Function using pg_net
      SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := request_payload::text
      ) INTO response_id;
      
      -- Log the Edge Function call
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at, payload)
      VALUES (
        'ai_evaluation_trigger',
        'edge_function_called',
        'Edge Function call initiated with response_id: ' || response_id,
        NEW.id,
        NEW.job_id,
        NOW(),
        jsonb_build_object(
          'edge_function_url', function_url,
          'response_id', response_id,
          'request_payload', request_payload
        )
      );
      
      -- Log success notice (same as original)
      RAISE NOTICE 'AI evaluation trigger fired for candidate: %, job: %', NEW.id, NEW.job_id;
      
    ELSE
      -- Log that evaluation already exists
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'skipped',
        'AI evaluation already exists for this candidate-job combination',
        NEW.id,
        NEW.job_id,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors that occur during the trigger execution
    INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at, error_message)
    VALUES (
      'ai_evaluation_trigger',
      'error',
      'Error in trigger execution: ' || SQLERRM,
      NEW.id,
      NEW.job_id,
      NOW(),
      SQLERRM
    );
    
    -- Re-raise the error so the transaction is rolled back
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger with the original name
CREATE TRIGGER candidates_ai_evaluation_trigger
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation_completion();

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO anon;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticator;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO service_role;

-- Add helpful comments
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically calls ai-candidate-evaluation Edge Function when is_completed changes to true.';
COMMENT ON FUNCTION trigger_ai_evaluation_completion() IS 'Triggers AI evaluation by calling Edge Function when candidate completes interview using proper URL construction.'; 