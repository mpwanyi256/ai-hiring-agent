-- Fix evaluations table to properly handle candidate_id and update triggers
-- This migration ensures candidate_id is properly saved and triggers work correctly

-- First, let's ensure the evaluations table has the correct structure for candidate_id
DO $$
BEGIN
  -- Make sure candidate_id column exists and is properly referenced
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'candidate_id') THEN
    ALTER TABLE evaluations ADD COLUMN candidate_id UUID;
  END IF;
  
  -- Add foreign key constraint for candidate_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'evaluations_candidate_id_fkey' 
                 AND table_name = 'evaluations') THEN
    ALTER TABLE evaluations ADD CONSTRAINT evaluations_candidate_id_fkey 
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
  
  -- Ensure candidate_id is not nullable for proper data integrity
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'evaluations' AND column_name = 'candidate_id' AND is_nullable = 'YES') THEN
    -- First, clean up any null candidate_id records
    DELETE FROM evaluations WHERE candidate_id IS NULL;
    -- Then make it NOT NULL
    ALTER TABLE evaluations ALTER COLUMN candidate_id SET NOT NULL;
  END IF;
END $$;

-- Update the AI evaluation trigger to properly handle candidate_id
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();

-- Recreate the trigger function to properly handle candidate_id
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

-- Create a function to check for existing resume evaluations
CREATE OR REPLACE FUNCTION check_existing_resume_evaluation(p_candidate_id UUID, p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  evaluation_record RECORD;
  result JSON;
BEGIN
  -- Check for existing resume evaluation in the evaluations table
  SELECT * INTO evaluation_record
  FROM evaluations
  WHERE candidate_id = p_candidate_id 
    AND job_id = p_job_id 
    AND evaluation_type = 'resume'
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object(
      'exists', true,
      'evaluation_id', evaluation_record.id,
      'score', evaluation_record.resume_score,
      'summary', evaluation_record.resume_summary,
      'filename', evaluation_record.resume_filename,
      'created_at', evaluation_record.created_at
    );
  ELSE
    RETURN json_build_object('exists', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the check function
GRANT EXECUTE ON FUNCTION check_existing_resume_evaluation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_existing_resume_evaluation(UUID, UUID) TO anon;

-- Create a function to get resume evaluation by candidate and job
CREATE OR REPLACE FUNCTION get_resume_evaluation(p_candidate_id UUID, p_job_id UUID)
RETURNS JSON AS $$
DECLARE
  evaluation_record RECORD;
  result JSON;
BEGIN
  -- Get resume evaluation from evaluations table
  SELECT * INTO evaluation_record
  FROM evaluations
  WHERE candidate_id = p_candidate_id 
    AND job_id = p_job_id 
    AND evaluation_type = 'resume'
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'evaluation', json_build_object(
        'id', evaluation_record.id,
        'candidateId', evaluation_record.candidate_id,
        'jobId', evaluation_record.job_id,
        'evaluationType', evaluation_record.evaluation_type,
        'summary', evaluation_record.summary,
        'score', evaluation_record.score,
        'resumeScore', evaluation_record.resume_score,
        'resumeSummary', evaluation_record.resume_summary,
        'resumeFilename', evaluation_record.resume_filename,
        'strengths', evaluation_record.strengths,
        'redFlags', evaluation_record.red_flags,
        'skillsAssessment', evaluation_record.skills_assessment,
        'traitsAssessment', evaluation_record.traits_assessment,
        'recommendation', evaluation_record.recommendation,
        'feedback', evaluation_record.feedback,
        'createdAt', evaluation_record.created_at,
        'updatedAt', evaluation_record.updated_at
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'No resume evaluation found for this candidate and job'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the get function
GRANT EXECUTE ON FUNCTION get_resume_evaluation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_resume_evaluation(UUID, UUID) TO anon;

-- Add helpful comments
COMMENT ON FUNCTION check_existing_resume_evaluation(UUID, UUID) IS 'Check if a resume evaluation exists for a specific candidate-job combination';
COMMENT ON FUNCTION get_resume_evaluation(UUID, UUID) IS 'Get resume evaluation details for a specific candidate-job combination';
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true, ensuring candidate_id is properly handled'; 