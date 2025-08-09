-- Update trigger_ai_evaluation to use extensions.http_post with proper async handling
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  service_role_key TEXT;
  request_id BIGINT;
  response_status INTEGER;
  response_body TEXT;
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
    -- Try to call the Edge Function using extensions.http_post
    BEGIN
      -- Make the HTTP POST request (this is async)
      SELECT extensions.http_post(
        function_url,
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        request_payload::text
      ) INTO request_id;
      
      -- Wait a moment for the request to complete
      PERFORM pg_sleep(0.1);
      
      -- Get the response
      SELECT 
        status,
        content
      INTO 
        response_status,
        response_body
      FROM extensions.http_get_result(request_id);
      
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
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error and mark as failed
      UPDATE public.function_logs 
      SET 
        status = 'failed',
        error_message = 'pg_net error: ' || SQLERRM,
        completed_at = NOW()
      WHERE candidate_id = NEW.id 
        AND function_name = 'ai-candidate-evaluation'
        AND status = 'processing';
      
      RAISE WARNING 'Failed to call Edge Function for candidate %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation when candidate completes interview using extensions.http_post with proper async handling'; 