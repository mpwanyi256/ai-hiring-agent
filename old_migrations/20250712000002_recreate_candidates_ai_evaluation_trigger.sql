-- Migration: Recreate candidates_ai_evaluation_trigger on candidates table
-- This migration ensures the trigger is set up correctly and robustly

-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Recreate the trigger function
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

-- Recreate the trigger as AFTER UPDATE OF is_completed
CREATE TRIGGER candidates_ai_evaluation_trigger
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation();

-- Add helpful comment
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true, checking for job-specific evaluations';
COMMENT ON FUNCTION trigger_ai_evaluation() IS 'Triggers AI evaluation when candidate completes interview. Checks for existing evaluations per candidate-job combination.'; 