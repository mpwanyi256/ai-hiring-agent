-- Update AI evaluation trigger to pass both candidate_id and job_id
-- This enables checking for existing evaluations per job, not just per candidate

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();
DROP FUNCTION IF EXISTS manual_trigger_ai_evaluation(UUID, UUID);

-- Recreate the trigger function to pass both candidate_id and job_id
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  job_profile_id UUID;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Get the profile_id from the job associated with this candidate
    SELECT j.profile_id INTO job_profile_id
    FROM jobs j
    WHERE j.id = NEW.job_id;
    
    -- Log the trigger execution
    INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
    VALUES (
      'ai_evaluation_trigger',
      'triggered',
      'Candidate interview completed, triggering AI evaluation',
      NEW.id,
      NEW.job_id,
      NOW()
    );
    
    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
    ) THEN
      -- Log that candidate is ready for processing
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'ready_for_processing',
        'Candidate ready for AI evaluation for specific job',
        NEW.id,
        NEW.job_id,
        NOW()
      );
    ELSE
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER candidates_ai_evaluation_trigger
  AFTER UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation();

-- Create a manual trigger function that can be called directly with both parameters
CREATE OR REPLACE FUNCTION manual_trigger_ai_evaluation(p_candidate_id UUID, p_job_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  candidate_record candidates%ROWTYPE;
  job_profile_id UUID;
  actual_job_id UUID;
  result JSON;
BEGIN
  -- Get candidate record
  SELECT * INTO candidate_record FROM candidates WHERE id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
  
  -- Use provided job_id or fall back to candidate's job_id
  actual_job_id := COALESCE(p_job_id, candidate_record.job_id);
  
  -- Check if candidate is completed
  IF NOT candidate_record.is_completed THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate interview not completed yet'
    );
  END IF;
  
  -- Get the profile_id from the job
  SELECT j.profile_id INTO job_profile_id
  FROM jobs j
  WHERE j.id = actual_job_id;
  
  IF job_profile_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Job or profile not found'
    );
  END IF;
  
  -- Check if evaluation already exists for this specific candidate-job combination
  IF EXISTS (
    SELECT 1 FROM ai_evaluations 
    WHERE candidate_id = p_candidate_id AND job_id = actual_job_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'AI evaluation already exists for this candidate-job combination'
    );
  END IF;
  
  -- Log the manual trigger
  INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
  VALUES (
    'manual_ai_evaluation_trigger',
    'triggered',
    'Manual AI evaluation trigger called for specific job',
    p_candidate_id,
    actual_job_id,
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'candidate_id', p_candidate_id,
    'job_id', actual_job_id,
    'profile_id', job_profile_id,
    'message', 'Candidate ready for AI evaluation for specific job'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on manual trigger function
GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID, UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation() IS 'Triggers AI evaluation when candidate completes interview. Checks for existing evaluations per candidate-job combination.';
COMMENT ON FUNCTION manual_trigger_ai_evaluation(UUID, UUID) IS 'Manually trigger AI evaluation for a specific candidate-job combination. Returns profile_id needed for Edge Function call.';
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true, checking for job-specific evaluations'; 