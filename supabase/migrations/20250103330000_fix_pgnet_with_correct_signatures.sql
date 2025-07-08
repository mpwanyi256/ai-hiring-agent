-- Update trigger_ai_evaluation to use correct pg_net function signatures
-- Based on official Supabase pg_net documentation
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  service_role_key TEXT;
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
    -- Based on: https://supabase.com/docs/guides/database/extensions/pg_net
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

-- Create a function to check pg_net responses
CREATE OR REPLACE FUNCTION check_pgnet_responses()
RETURNS TABLE(
  request_id BIGINT,
  status_code INTEGER,
  content_type TEXT,
  content TEXT,
  error_msg TEXT,
  created TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.status_code,
    r.content_type,
    r.content,
    r.error_msg,
    r.created
  FROM net._http_response r
  ORDER BY r.created DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check failed requests
CREATE OR REPLACE FUNCTION check_failed_pgnet_requests()
RETURNS TABLE(
  request_id BIGINT,
  status_code INTEGER,
  error_msg TEXT,
  created TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.status_code,
    r.error_msg,
    r.created
  FROM net._http_response r
  WHERE r.status_code >= 400 OR r.error_msg IS NOT NULL
  ORDER BY r.created DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_pgnet_responses() TO authenticated;
GRANT EXECUTE ON FUNCTION check_failed_pgnet_requests() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation using net.http_post with correct signature from Supabase pg_net docs';
COMMENT ON FUNCTION check_pgnet_responses IS 'Check recent pg_net HTTP responses';
COMMENT ON FUNCTION check_failed_pgnet_requests IS 'Check failed pg_net HTTP requests'; 