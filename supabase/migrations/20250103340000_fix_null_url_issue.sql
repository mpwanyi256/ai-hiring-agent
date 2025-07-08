-- Fix the null URL issue in trigger_ai_evaluation
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  service_role_key TEXT;
  request_id BIGINT;
  project_ref TEXT;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Get the service role key
    service_role_key := get_service_role_key();
    
    -- Get the project reference with proper error handling
    project_ref := 'msrspatwjkmyhgqucxuh';
    
    -- Check if project_ref is null or empty
    IF project_ref IS NULL OR project_ref = '' THEN
      -- Log error and return without making HTTP request
      INSERT INTO public.function_logs (
        function_name,
        payload,
        triggered_at,
        candidate_id,
        job_id,
        status,
        error_message
      ) VALUES (
        'ai-candidate-evaluation',
        jsonb_build_object(
          'candidateId', NEW.id,
          'jobId', NEW.job_id,
          'profileId', (
            SELECT profile_id 
            FROM jobs 
            WHERE id = NEW.job_id
          )
        ),
        NOW(),
        NEW.id,
        NEW.job_id,
        'failed',
        'Project reference not configured. Please set app.settings.supabase_project_ref'
      );
      
      RAISE WARNING 'Project reference not configured for candidate %. Skipping Edge Function call.', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Build the function URL
    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/ai-candidate-evaluation';
    
    -- Prepare payload for the Edge Function
    request_payload := jsonb_build_object(
      'candidateId', NEW.id,
      'jobId', NEW.job_id,
      'serviceRoleKey', service_role_key,
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
    
    -- Call the Edge Function using net.http_post with correct signature
    BEGIN
      SELECT net.http_post(
        url := function_url,
        body := request_payload,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        )
      ) INTO request_id;
      
      -- If we get here, the request was queued successfully
      UPDATE public.function_logs 
      SET 
        status = 'success',
        completed_at = NOW()
      WHERE candidate_id = NEW.id 
        AND function_name = 'ai-candidate-evaluation'
        AND status = 'processing';
      
      RAISE NOTICE 'AI evaluation request queued successfully for candidate: % (request_id: %)', NEW.id, request_id;
      
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
      
      RAISE WARNING 'Failed to queue Edge Function request for candidate %: %', NEW.id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set the project reference
CREATE OR REPLACE FUNCTION set_supabase_project_ref(project_ref TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Set the project reference in the session
  PERFORM set_config('app.settings.supabase_project_ref', project_ref, false);
  
  RETURN 'Project reference set to: ' || project_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current project reference
CREATE OR REPLACE FUNCTION get_supabase_project_ref()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.settings.supabase_project_ref', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_supabase_project_ref(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_supabase_project_ref() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation with proper URL validation';
COMMENT ON FUNCTION set_supabase_project_ref IS 'Set the Supabase project reference for Edge Function calls';
COMMENT ON FUNCTION get_supabase_project_ref IS 'Get the current Supabase project reference'; 