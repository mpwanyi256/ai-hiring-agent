-- Safe migration to fix candidate ID to be unique per application
-- This migration handles existing data properly

-- 1. First, let's check what data we have and clean up orphaned records
-- Show orphaned candidate_id values in each referencing table
SELECT candidate_id FROM responses WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM evaluations WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM ai_evaluations WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM candidate_resumes WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM team_assessments WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM candidate_analytics WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM candidate_response_analytics WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM interview_schedules WHERE candidate_id NOT IN (SELECT id FROM candidates);
SELECT candidate_id FROM function_logs WHERE candidate_id NOT IN (SELECT id FROM candidates);

-- Delete orphaned responses that reference non-existent candidates
DELETE FROM responses 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM evaluations 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM ai_evaluations 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM candidate_resumes 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM team_assessments 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM candidate_analytics 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM candidate_response_analytics 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM interview_schedules 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

DELETE FROM function_logs 
WHERE candidate_id NOT IN (SELECT id FROM candidates);

-- 2. Drop all FKs referencing candidates.id
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_candidate_id_fkey;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_candidate_id_fkey;
ALTER TABLE ai_evaluations DROP CONSTRAINT IF EXISTS ai_evaluations_candidate_id_fkey;
ALTER TABLE candidate_resumes DROP CONSTRAINT IF EXISTS candidate_resumes_candidate_id_fkey;
ALTER TABLE team_assessments DROP CONSTRAINT IF EXISTS team_assessments_candidate_id_fkey;
ALTER TABLE candidate_analytics DROP CONSTRAINT IF EXISTS candidate_analytics_candidate_id_fkey;
ALTER TABLE candidate_response_analytics DROP CONSTRAINT IF EXISTS candidate_response_analytics_candidate_id_fkey;
ALTER TABLE interview_schedules DROP CONSTRAINT IF EXISTS interview_schedules_candidate_id_fkey;
ALTER TABLE function_logs DROP CONSTRAINT IF EXISTS function_logs_candidate_id_fkey;

-- 3. Drop PK and update id logic
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_pkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_id_fkey;
ALTER TABLE candidates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE candidates ALTER COLUMN id DROP NOT NULL;
ALTER TABLE candidates ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Update existing candidates to have unique IDs (not matching candidate_info_id)
UPDATE candidates SET id = gen_random_uuid() WHERE id = candidate_info_id;

ALTER TABLE candidates ALTER COLUMN id SET NOT NULL;
ALTER TABLE candidates ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);

-- 5. Re-add all FKs
ALTER TABLE responses ADD CONSTRAINT responses_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluations ADD CONSTRAINT ai_evaluations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE candidate_resumes ADD CONSTRAINT candidate_resumes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE team_assessments ADD CONSTRAINT team_assessments_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE candidate_analytics ADD CONSTRAINT candidate_analytics_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE candidate_response_analytics ADD CONSTRAINT candidate_response_analytics_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE interview_schedules ADD CONSTRAINT interview_schedules_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE function_logs ADD CONSTRAINT function_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;

-- 6. Update create_candidate_info_and_record to use unique candidate IDs
CREATE OR REPLACE FUNCTION create_candidate_info_and_record(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_job_id UUID,
  p_interview_token TEXT
)
RETURNS JSON AS $$
DECLARE
  new_candidate_info_id UUID;
  candidate_id UUID;
  result JSON;
BEGIN
  -- Create or get existing candidate info
  INSERT INTO candidates_info (id, first_name, last_name, email, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    p_first_name,
    p_last_name,
    p_email,
    NOW(),
    NOW()
  )
  ON CONFLICT (email)
  DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW()
  RETURNING id INTO new_candidate_info_id;

  -- Check if a candidate already exists for this job and candidate_info_id
  SELECT id INTO candidate_id FROM candidates
    WHERE job_id = p_job_id AND candidate_info_id = new_candidate_info_id
    LIMIT 1;

  IF candidate_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'candidate_info_id', new_candidate_info_id,
      'candidate_id', candidate_id,
      'message', 'Existing candidate found for this job and candidate info'
    );
  END IF;

  -- Create candidate record if not found (new UUID for id)
  INSERT INTO candidates (id, job_id, candidate_info_id, interview_token, current_step, total_steps, is_completed, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    p_job_id,
    new_candidate_info_id,
    p_interview_token,
    1,
    5,
    false,
    NOW(),
    NOW()
  ) RETURNING id INTO candidate_id;

  RETURN json_build_object(
    'success', true,
    'candidate_info_id', new_candidate_info_id,
    'candidate_id', candidate_id,
    'message', 'Candidate info and record created successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update comments
COMMENT ON COLUMN candidates.id IS 'Unique per application. Used as PK and for all foreign keys.';
COMMENT ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) IS 'Creates a candidate info and candidate record in one transaction, allowing multiple applications per person.'; 