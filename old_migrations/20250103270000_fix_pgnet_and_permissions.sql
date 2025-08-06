-- First, let's check if pg_net is properly enabled and use the correct function
-- The issue might be that we need to use the full schema name or different function signature

-- Drop and recreate the trigger function with a simpler approach
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
  service_role_key TEXT;
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
    
    -- Try to call the Edge Function using pg_net
    -- Use a more explicit approach with proper error handling
    BEGIN
      -- Use the full schema name and try different function signatures
      PERFORM extensions.http_post(
        function_url,
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        request_payload::text
      );
      
      -- If we get here, the call was successful
      UPDATE public.function_logs 
      SET 
        status = 'success',
        completed_at = NOW()
      WHERE candidate_id = NEW.id 
        AND function_name = 'ai-candidate-evaluation'
        AND status = 'processing';
      
      RAISE NOTICE 'AI evaluation triggered successfully for candidate: %', NEW.id;
      
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

-- Fix permissions for candidates table
-- Grant update permission to authenticated users for their own candidates
CREATE POLICY "Users can update their own candidates" ON candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = candidates.job_id AND j.profile_id = auth.uid()
    )
  );

-- Grant update permission to service role
CREATE POLICY "Service role can update candidates" ON candidates
  FOR UPDATE USING (auth.role() = 'service_role');

-- Ensure authenticated users have update permission
GRANT UPDATE ON candidates TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation when candidate completes interview using extensions.http_post'; 