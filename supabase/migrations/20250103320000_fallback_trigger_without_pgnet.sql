-- Create a fallback trigger function that doesn't use pg_net
-- This will log events and rely on application-level processing
CREATE OR REPLACE FUNCTION trigger_ai_evaluation_fallback()
RETURNS TRIGGER AS $$
DECLARE
  request_payload JSONB;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
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
    
    -- Log the trigger event with pending status
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
      'pending'
    );
    
    RAISE NOTICE 'AI evaluation trigger logged for candidate: %. Call the Edge Function manually with payload: %', NEW.id, request_payload;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually process pending evaluations
CREATE OR REPLACE FUNCTION process_pending_ai_evaluations()
RETURNS TABLE(
  candidate_id UUID,
  job_id UUID,
  payload JSONB,
  message TEXT
) AS $$
DECLARE
  pending_record RECORD;
BEGIN
  -- Get all pending evaluations
  FOR pending_record IN 
    SELECT 
      fl.candidate_id,
      fl.job_id,
      fl.payload,
      fl.id as log_id
    FROM function_logs fl
    WHERE fl.status = 'pending'
      AND fl.function_name = 'ai-candidate-evaluation'
    ORDER BY fl.triggered_at ASC
  LOOP
    -- Update status to processing
    UPDATE function_logs 
    SET status = 'processing'
    WHERE id = pending_record.log_id;
    
    -- Return the record for processing
    candidate_id := pending_record.candidate_id;
    job_id := pending_record.job_id;
    payload := pending_record.payload;
    message := 'Pending evaluation found. Call Edge Function with this payload.';
    
    RETURN NEXT;
  END LOOP;
  
  -- If no pending evaluations found
  IF NOT FOUND THEN
    candidate_id := NULL;
    job_id := NULL;
    payload := NULL;
    message := 'No pending evaluations found.';
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_fallback() TO postgres;
GRANT EXECUTE ON FUNCTION process_pending_ai_evaluations() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation_fallback IS 'Fallback trigger that logs AI evaluation events without using pg_net';
COMMENT ON FUNCTION process_pending_ai_evaluations IS 'Function to get pending AI evaluations for manual processing'; 