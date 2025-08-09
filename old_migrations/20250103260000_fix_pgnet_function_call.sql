-- Ensure pg_net extension is properly enabled
CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA "extensions";

-- Update trigger function to use the correct pg_net function signature
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  service_role_key TEXT;
  response_status INTEGER;
  response_body TEXT;
  request_id BIGINT;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Get the service role key
    service_role_key := get_service_role_key();
    
    -- Get the Supabase function URL
    function_url := 'https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/ai-candidate-evaluation';
    
    -- Prepare payload for the Edge Function
    request_payload := jsonb_build_object(
      'candidateId', NEW.id,
      'jobId', NEW.job_id,
      'profileId', (
        SELECT profile_id 
        FROM jobs 
        WHERE id = NEW.job_id
      )
    );
    
    -- Log the trigger event
    INSERT INTO public.function_logs (
      function_name,
      payload,
      triggered_at,
      candidate_id,
      job_id,
      status
    ) VALUES (
      'ai-candidate-evaluation',
      request_payload,
      NOW(),
      NEW.id,
      NEW.job_id,
      'processing'
    );
    
    -- Call the Edge Function using pg_net with correct function signature
    SELECT net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := request_payload::text
    ) INTO request_id;
    
    -- Wait for the response and get status
    SELECT 
      status,
      content
    INTO 
      response_status,
      response_body
    FROM net.http_get_result(request_id);
    
    -- Update the function log based on the response
    IF response_status = 200 THEN
      UPDATE public.function_logs 
      SET 
        status = 'success',
        completed_at = NOW()
      WHERE candidate_id = NEW.id 
        AND function_name = 'ai-candidate-evaluation'
        AND status = 'processing';
      
      RAISE NOTICE 'AI evaluation completed successfully for candidate: %', NEW.id;
    ELSE
      UPDATE public.function_logs 
      SET 
        status = 'failed',
        error_message = 'HTTP ' || response_status || ': ' || response_body,
        completed_at = NOW()
      WHERE candidate_id = NEW.id 
        AND function_name = 'ai-candidate-evaluation'
        AND status = 'processing';
      
      RAISE WARNING 'AI evaluation failed for candidate: % - Status: %, Response: %', NEW.id, response_status, response_body;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation when candidate completes interview using pg_net for direct Edge Function calls'; 