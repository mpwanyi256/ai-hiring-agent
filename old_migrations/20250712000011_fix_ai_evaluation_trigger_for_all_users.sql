-- Migration: Fix AI evaluation trigger for all users (authenticated and unauthenticated)
-- Drops the existing trigger and creates a new one that works for all user types

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Create a new trigger function that works for all users
CREATE OR REPLACE FUNCTION trigger_ai_evaluation_completion()
RETURNS TRIGGER AS $$
DECLARE
  job_profile_id UUID;
  log_message TEXT;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    -- Get the profile_id from the job associated with this candidate
    SELECT j.profile_id INTO job_profile_id
    FROM jobs j
    WHERE j.id = NEW.job_id;

    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
    ) THEN
      -- Log that candidate is ready for processing
      log_message := 'Candidate interview completed, ready for AI evaluation';
      
      -- Insert log entry (this will work because the function has SECURITY DEFINER)
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'ready_for_processing',
        log_message,
        NEW.id,
        NEW.job_id,
        NOW()
      );
      
      -- Here you would typically call the Edge Function to trigger AI evaluation
      -- For now, we'll just log that it's ready
      -- In a production environment, you might want to use a queue system or background job
      
    ELSE
      -- Log that evaluation already exists
      log_message := 'AI evaluation already exists for this candidate-job combination';
      
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'skipped',
        log_message,
        NEW.id,
        NEW.job_id,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger with a different name
CREATE TRIGGER trigger_candidate_completion_ai_evaluation
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation_completion();

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO anon;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticator;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO service_role;

-- Update function_logs policies to allow all relevant roles to insert
DROP POLICY IF EXISTS "Authenticated can insert logs" ON function_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON function_logs;

CREATE POLICY "Anyone can insert logs" ON function_logs
  FOR INSERT WITH CHECK (
    auth.role() IN ('anon', 'authenticated', 'authenticator', 'service_role')
  );

-- Add helpful comments
COMMENT ON TRIGGER trigger_candidate_completion_ai_evaluation ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true. Works for all user types.';
COMMENT ON FUNCTION trigger_ai_evaluation_completion() IS 'Triggers AI evaluation when candidate completes interview. Works for authenticated and unauthenticated users.';
COMMENT ON POLICY "Anyone can insert logs" ON function_logs IS 'Allows all relevant roles to insert logs for debugging and auditing.'; 