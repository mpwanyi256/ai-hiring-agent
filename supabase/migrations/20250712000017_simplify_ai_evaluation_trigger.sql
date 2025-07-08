-- Migration: Simplify AI evaluation trigger to just log events
-- This migration goes back to the original approach of logging events and providing manual triggers

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation_completion();
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Create a simple trigger function that just logs the event
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
    ) THEN
      
      -- Get the project reference (same pattern as original migration)
      function_url := 'https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/ai-candidate-evaluation';
      
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
      
      -- Log the trigger event (same as original migration)
      INSERT INTO public.function_logs (
        function_name,
        status,
        message,
        payload,
        candidate_id,
        job_id,
        created_at
      ) VALUES (
        'ai-candidate-evaluation',
        'triggered',
        'Candidate interview completed, ready for AI evaluation',
        request_payload,
        NEW.id,
        NEW.job_id,
        NOW()
      );
      
      -- Log success notice (same as original)
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
  EXECUTE FUNCTION trigger_ai_evaluation();

-- Create a manual trigger function that can be called from the application
CREATE OR REPLACE FUNCTION manual_trigger_ai_evaluation(
  p_candidate_id UUID,
  p_force BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  candidate_record RECORD;
  result JSONB;
BEGIN
  -- Get candidate with job info
  SELECT c.*, j.profile_id, j.title as job_title
  INTO candidate_record
  FROM candidates c
  JOIN jobs j ON c.job_id = j.id
  WHERE c.id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
  
  -- Check if candidate interview is completed
  IF NOT candidate_record.is_completed AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidate interview not completed'
    );
  END IF;
  
  -- Check if AI evaluation already exists
  IF EXISTS (SELECT 1 FROM ai_evaluations WHERE candidate_id = p_candidate_id AND job_id = candidate_record.job_id) AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'AI evaluation already exists for this candidate-job combination'
    );
  END IF;
  
  -- Log the manual trigger
  INSERT INTO function_logs (
    function_name,
    status,
    message,
    payload,
    candidate_id,
    job_id,
    created_at
  ) VALUES (
    'ai-candidate-evaluation-manual',
    'manual_trigger',
    'Manual AI evaluation trigger requested',
    jsonb_build_object(
      'candidateId', candidate_record.id,
      'jobId', candidate_record.job_id,
      'profileId', candidate_record.profile_id,
      'force', p_force
    ),
    candidate_record.id,
    candidate_record.job_id,
    NOW()
  );
  
  -- Return success with details for manual processing
  RETURN jsonb_build_object(
    'success', true,
    'candidateId', candidate_record.id,
    'jobId', candidate_record.job_id,
    'profileId', candidate_record.profile_id,
    'message', 'Manual AI evaluation trigger logged. Call the Edge Function with these parameters.'
  );
END;
$$;

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO anon;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO authenticator;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO service_role;

GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID, BOOLEAN) TO service_role;

-- Add helpful comments
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically logs AI evaluation events when is_completed changes to true.';
COMMENT ON FUNCTION trigger_ai_evaluation() IS 'Logs AI evaluation events when candidate completes interview.';
COMMENT ON FUNCTION manual_trigger_ai_evaluation(UUID, BOOLEAN) IS 'Manually trigger AI evaluation for a specific candidate.'; 