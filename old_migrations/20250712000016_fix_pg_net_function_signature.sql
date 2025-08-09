-- Migration: Fix pg_net function signature for AI evaluation trigger
-- This migration fixes the net.http_post function call to use the correct signature

-- First, make sure the pg_net extension is installed
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "net";

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation_completion();

-- Create a new trigger function with correct pg_net function signature
CREATE OR REPLACE FUNCTION trigger_ai_evaluation_completion()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  project_ref TEXT;
  anon_key TEXT;
  request_payload JSONB;
  headers JSONB;
  response_id UUID;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
    ) THEN
      
      -- Get the project reference with explicit error handling
      BEGIN
        project_ref := current_setting('app.settings.supabase_project_ref');
      EXCEPTION WHEN OTHERS THEN
        -- Log the error and use a hardcoded project reference
        INSERT INTO function_logs (
          function_name, status, message, candidate_id, job_id, created_at, error_message
        ) VALUES (
          'ai_evaluation_trigger',
          'warning',
          'Could not get project_ref from settings',
          NEW.id,
          NEW.job_id,
          NOW(),
          SQLERRM
        );
        -- Use your actual project reference here
        project_ref := 'msrspatwjkmyhgqucxuh';
      END;
      
      -- Get the anon key with explicit error handling
      BEGIN
        anon_key := current_setting('app.settings.anon_key');
      EXCEPTION WHEN OTHERS THEN
        -- Log the error
        INSERT INTO function_logs (
          function_name, status, message, candidate_id, job_id, created_at, error_message
        ) VALUES (
          'ai_evaluation_trigger',
          'warning',
          'Could not get anon_key from settings',
          NEW.id,
          NEW.job_id,
          NOW(),
          SQLERRM
        );
        -- We'll continue without the anon key
        anon_key := NULL;
      END;
      
      -- Construct the Edge Function URL using the project reference
      function_url := 'https://' || project_ref || '.supabase.co/functions/v1/ai-candidate-evaluation';
      
      -- Prepare payload for the Edge Function
      request_payload := jsonb_build_object(
        'candidateId', NEW.id,
        'jobId', NEW.job_id
      );

      -- Prepare headers with anon key
      headers := jsonb_build_object('Content-Type', 'application/json');
      
      -- Only add Authorization header if we have an anon key
      IF anon_key IS NOT NULL THEN
        headers := headers || jsonb_build_object('Authorization', 'Bearer ' || anon_key);
      END IF;

      -- Log the trigger event with the URL we're about to call
      INSERT INTO public.function_logs (
        function_name,
        status,
        message,
        payload,
        triggered_at,
        candidate_id,
        job_id
      ) VALUES (
        'ai-candidate-evaluation',
        'triggering_edge_function',
        'Calling Edge Function at URL: ' || function_url,
        request_payload,
        NOW(),
        NEW.id,
        NEW.job_id
      );
      
      -- Call the Edge Function using pg_net with the correct function signature
      -- Make sure the URL is not null
      IF function_url IS NULL THEN
        RAISE EXCEPTION 'Edge Function URL is null';
      END IF;
      
      response_id := net.http_post(
        url := function_url,
        body := request_payload,
        headers := headers
      );
      
      -- Log the Edge Function call
      INSERT INTO function_logs (
        function_name, 
        status, 
        message, 
        candidate_id, 
        job_id, 
        created_at, 
        payload
      ) VALUES (
        'ai_evaluation_trigger',
        'edge_function_called',
        'Edge Function call initiated with response_id: ' || response_id::text,
        NEW.id,
        NEW.job_id,
        NOW(),
        jsonb_build_object(
          'edge_function_url', function_url,
          'response_id', response_id,
          'request_payload', request_payload
        )
      );
      
      -- Log success notice
      RAISE NOTICE 'AI evaluation trigger fired for candidate: %, job: %', NEW.id, NEW.job_id;
      
    ELSE
      -- Log that evaluation already exists
      INSERT INTO function_logs (
        function_name, 
        status, 
        message, 
        candidate_id, 
        job_id, 
        created_at
      ) VALUES (
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
    INSERT INTO function_logs (
      function_name, 
      status, 
      message, 
      candidate_id, 
      job_id, 
      created_at, 
      error_message
    ) VALUES (
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
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO service_role;

-- Add helpful comments
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically calls ai-candidate-evaluation Edge Function when is_completed changes to true.';
COMMENT ON FUNCTION trigger_ai_evaluation_completion() IS 'Triggers AI evaluation by calling Edge Function when candidate completes interview using correct pg_net function signature.';