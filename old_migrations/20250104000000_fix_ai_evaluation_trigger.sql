-- Fix AI evaluation trigger and remove profile_id field
-- This migration addresses the issue where we were using profile_id instead of candidate_id

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Remove profile_id column from ai_evaluations table
ALTER TABLE ai_evaluations DROP COLUMN IF EXISTS profile_id;

-- Update the trigger function to use candidate_id and get profile_id from jobs table
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
    
    -- Check if evaluation already exists
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id
    ) THEN
      -- Call the Edge Function (this will be handled by the application layer)
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'ready_for_processing',
        'Candidate ready for AI evaluation',
        NEW.id,
        NEW.job_id,
        NOW()
      );
    ELSE
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'skipped',
        'AI evaluation already exists for this candidate',
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

-- Create a manual trigger function that can be called directly
CREATE OR REPLACE FUNCTION manual_trigger_ai_evaluation(p_candidate_id UUID)
RETURNS JSON AS $$
DECLARE
  candidate_record candidates%ROWTYPE;
  job_profile_id UUID;
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
  WHERE j.id = candidate_record.job_id;
  
  IF job_profile_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Job or profile not found'
    );
  END IF;
  
  -- Check if evaluation already exists
  IF EXISTS (SELECT 1 FROM ai_evaluations WHERE candidate_id = p_candidate_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'AI evaluation already exists for this candidate'
    );
  END IF;
  
  -- Log the manual trigger
  INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
  VALUES (
    'manual_ai_evaluation_trigger',
    'triggered',
    'Manual AI evaluation trigger called',
    p_candidate_id,
    candidate_record.job_id,
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'candidate_id', p_candidate_id,
    'job_id', candidate_record.job_id,
    'profile_id', job_profile_id,
    'message', 'Candidate ready for AI evaluation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for ai_evaluations table (remove profile_id references)
DROP POLICY IF EXISTS "Users can view their AI evaluations" ON ai_evaluations;
DROP POLICY IF EXISTS "Service role can insert AI evaluations" ON ai_evaluations;
DROP POLICY IF EXISTS "Service role can update AI evaluations" ON ai_evaluations;

-- Create updated RLS policies based on candidate ownership through jobs
CREATE POLICY "Users can view their AI evaluations" ON ai_evaluations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM candidates c
    JOIN jobs j ON c.job_id = j.id
    WHERE c.id = candidate_id 
    AND j.profile_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert AI evaluations" ON ai_evaluations
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update AI evaluations" ON ai_evaluations
FOR UPDATE USING (auth.role() = 'service_role');

-- Add comment for clarity
COMMENT ON FUNCTION trigger_ai_evaluation() IS 'Triggers AI evaluation when candidate completes interview. Uses candidate_id and gets profile_id from jobs table.';
COMMENT ON FUNCTION manual_trigger_ai_evaluation(UUID) IS 'Manually trigger AI evaluation for a specific candidate. Returns profile_id needed for Edge Function call.'; 