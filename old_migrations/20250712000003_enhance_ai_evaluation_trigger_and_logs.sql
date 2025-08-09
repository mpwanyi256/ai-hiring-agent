-- Migration: Enhance AI evaluation trigger and allow authenticated users to log
-- 1. Drop and recreate the trigger function with enhanced logging
-- 2. Drop and recreate the trigger as AFTER UPDATE OF is_completed
-- 3. Allow authenticated users to insert into function_logs

-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Enhanced trigger function with more logging
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  job_profile_id UUID;
BEGIN
  -- Log every time the trigger function is called
  INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
  VALUES (
    'ai_evaluation_trigger',
    'called',
    format('Trigger called with OLD.is_completed=%s, NEW.is_completed=%s', 
           CASE WHEN OLD.is_completed IS NULL THEN 'NULL' ELSE OLD.is_completed::text END,
           CASE WHEN NEW.is_completed IS NULL THEN 'NULL' ELSE NEW.is_completed::text END),
    NEW.id,
    NEW.job_id,
    NOW()
  );

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

-- Add/Update policy to allow authenticated users to insert into function_logs
DROP POLICY IF EXISTS "Users can view logs for their jobs" ON function_logs;
DROP POLICY IF EXISTS "Authenticated can insert logs" ON function_logs;

CREATE POLICY "Users can view logs for their jobs" ON function_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can insert logs" ON function_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );

-- Add helpful comments
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true, with enhanced logging.';
COMMENT ON FUNCTION trigger_ai_evaluation() IS 'Triggers AI evaluation when candidate completes interview. Logs every call and checks for existing evaluations per candidate-job combination.';
COMMENT ON POLICY "Authenticated can insert logs" ON function_logs IS 'Allows authenticated users and service_role to insert logs for debugging and auditing.'; 