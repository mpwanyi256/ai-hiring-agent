-- Migration: Fix AI evaluation trigger to call Edge Function
-- Updates the trigger function to actually call the ai-candidate-evaluation Edge Function

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_candidate_completion_ai_evaluation ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation_completion();

-- Create a new trigger function that calls the Edge Function
CREATE OR REPLACE FUNCTION trigger_ai_evaluation_completion()
RETURNS TRIGGER AS $$
DECLARE
  job_profile_id UUID;
  log_message TEXT;
  edge_function_url TEXT;
  response_status INTEGER;
  response_body TEXT;
  request_body JSONB;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    -- Get the profile_id from the job associated with this candidate
    SELECT j.profile_id INTO job_profile_id
    FROM jobs j
    WHERE j.id = NEW.job_id;

    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
    ) THEN
      -- Log that candidate is ready for processing
      log_message := 'Candidate interview completed, triggering AI evaluation via Edge Function';
      
      -- Insert log entry
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'triggering_edge_function',
        log_message,
        NEW.id,
        NEW.job_id,
        NOW()
      );
      
      -- Construct the Edge Function URL
      edge_function_url := current_setting('app.settings.supabase_url') || '/functions/v1/ai-candidate-evaluation';
      
      -- Prepare the request body
      request_body := jsonb_build_object(
        'candidateId', NEW.id,
        'jobId', NEW.job_id
      );
      
      -- Call the Edge Function
      SELECT 
        status,
        content
      INTO 
        response_status,
        response_body
      FROM 
        http((
          'POST',
          edge_function_url,
          ARRAY[
            ('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))::http_header,
            ('Content-Type', 'application/json')::http_header
          ],
          'application/json',
          request_body::text
        ));
      
      -- Log the Edge Function response
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at, payload)
      VALUES (
        'ai_evaluation_trigger',
        CASE 
          WHEN response_status = 202 THEN 'edge_function_success'
          ELSE 'edge_function_error'
        END,
        'Edge Function response: ' || response_status || ' - ' || response_body,
        NEW.id,
        NEW.job_id,
        NOW(),
        jsonb_build_object(
          'edge_function_url', edge_function_url,
          'response_status', response_status,
          'response_body', response_body
        )
      );
      
    ELSE
      -- Log that evaluation already exists
      log_message := 'AI evaluation already exists for this candidate-job combination';
      
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'skipped',
        log_message,
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

-- Create the trigger
CREATE TRIGGER trigger_candidate_completion_ai_evaluation
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation_completion();

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO anon;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticator;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO service_role;

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Add helpful comments
COMMENT ON TRIGGER trigger_candidate_completion_ai_evaluation ON candidates IS 'Automatically calls ai-candidate-evaluation Edge Function when is_completed changes to true.';
COMMENT ON FUNCTION trigger_ai_evaluation_completion() IS 'Triggers AI evaluation by calling Edge Function when candidate completes interview.'; 