-- Fix candidate id logic: candidates.id == candidates_info.id
-- 1. Remove default gen_random_uuid() from candidates.id and set it to match candidate_info_id
-- 2. Update create_candidate_info_and_record to use candidate_info_id as id
-- 3. Update all referencing tables and drop unnecessary columns from candidate_resumes
-- 4. Migrate existing data

-- 1. Drop and recreate candidates.id as PK, referencing candidates_info.id
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_candidate_id_fkey;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_candidate_id_fkey;
ALTER TABLE ai_evaluations DROP CONSTRAINT IF EXISTS ai_evaluations_candidate_id_fkey;
ALTER TABLE candidate_resumes DROP CONSTRAINT IF EXISTS candidate_resumes_candidate_id_fkey;
ALTER TABLE team_assessments DROP CONSTRAINT IF EXISTS team_assessments_candidate_id_fkey;
ALTER TABLE function_logs DROP CONSTRAINT IF EXISTS function_logs_candidate_id_fkey;

ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_pkey;

-- Temporarily allow nulls for id to update values
ALTER TABLE candidates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE candidates ALTER COLUMN id DROP NOT NULL;

-- 2. Migrate existing data: set candidates.id = candidate_info_id where candidate_info_id is not null
UPDATE candidates SET id = candidate_info_id WHERE candidate_info_id IS NOT NULL;

-- 3. Set id as PK and FK to candidates_info
ALTER TABLE candidates ALTER COLUMN id SET NOT NULL;
ALTER TABLE candidates ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);
ALTER TABLE candidates ADD CONSTRAINT candidates_id_fkey FOREIGN KEY (id) REFERENCES candidates_info(id) ON DELETE CASCADE;

-- 4. Update referencing tables to point to new id (handle both old and new references)
UPDATE responses SET candidate_id = (
  SELECT c.id FROM candidates c 
  WHERE (c.id = responses.candidate_id OR c.candidate_info_id = responses.candidate_id)
  AND responses.candidate_id IS NOT NULL
) WHERE candidate_id IS NOT NULL;

UPDATE evaluations SET candidate_id = (
  SELECT c.id FROM candidates c 
  WHERE (c.id = evaluations.candidate_id OR c.candidate_info_id = evaluations.candidate_id)
  AND evaluations.candidate_id IS NOT NULL
) WHERE candidate_id IS NOT NULL;

UPDATE ai_evaluations SET candidate_id = (
  SELECT c.id FROM candidates c 
  WHERE (c.id = ai_evaluations.candidate_id OR c.candidate_info_id = ai_evaluations.candidate_id)
  AND ai_evaluations.candidate_id IS NOT NULL
) WHERE candidate_id IS NOT NULL;

UPDATE candidate_resumes SET candidate_id = (
  SELECT c.id FROM candidates c 
  WHERE (c.id = candidate_resumes.candidate_id OR c.candidate_info_id = candidate_resumes.candidate_id)
  AND candidate_resumes.candidate_id IS NOT NULL
) WHERE candidate_id IS NOT NULL;

UPDATE team_assessments SET candidate_id = (
  SELECT c.id FROM candidates c 
  WHERE (c.id = team_assessments.candidate_id OR c.candidate_info_id = team_assessments.candidate_id)
  AND team_assessments.candidate_id IS NOT NULL
) WHERE candidate_id IS NOT NULL;

UPDATE function_logs SET candidate_id = (
  SELECT c.id FROM candidates c 
  WHERE (c.id = function_logs.candidate_id OR c.candidate_info_id = function_logs.candidate_id)
  AND function_logs.candidate_id IS NOT NULL
) WHERE candidate_id IS NOT NULL;

-- 5. Re-add foreign key constraints
ALTER TABLE responses ADD CONSTRAINT responses_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE ai_evaluations ADD CONSTRAINT ai_evaluations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE candidate_resumes ADD CONSTRAINT candidate_resumes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE team_assessments ADD CONSTRAINT team_assessments_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE function_logs ADD CONSTRAINT function_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;

-- 6. Drop dependencies that reference candidate_resumes columns before dropping columns
DROP FUNCTION IF EXISTS get_job_candidate_details(uuid,uuid,text,text,integer,integer);
DROP VIEW IF EXISTS candidate_details;

-- 7. Drop email, first_name, last_name from candidate_resumes
ALTER TABLE candidate_resumes DROP COLUMN IF EXISTS email;
ALTER TABLE candidate_resumes DROP COLUMN IF EXISTS first_name;
ALTER TABLE candidate_resumes DROP COLUMN IF EXISTS last_name;

-- 8. Update create_candidate_info_and_record to use candidate_info_id as id
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
  existing_candidate_id UUID;
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
  SELECT id INTO existing_candidate_id FROM candidates
    WHERE job_id = p_job_id AND candidate_info_id = new_candidate_info_id
    LIMIT 1;

  IF existing_candidate_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'candidate_info_id', new_candidate_info_id,
      'candidate_id', existing_candidate_id,
      'message', 'Existing candidate found for this job and candidate info'
    );
  END IF;

  -- Create candidate record if not found, using candidate_info_id as id
  INSERT INTO candidates (id, job_id, candidate_info_id, interview_token, current_step, total_steps, is_completed, created_at, updated_at)
  VALUES (
    new_candidate_info_id,
    p_job_id,
    new_candidate_info_id,
    p_interview_token,
    1,
    5,
    false,
    NOW(),
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'candidate_info_id', new_candidate_info_id,
    'candidate_id', new_candidate_info_id,
    'message', 'Candidate info and record created successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update comments and documentation
COMMENT ON COLUMN candidates.id IS 'Matches candidates_info.id; unique per person. Used as PK and for all foreign keys.';
COMMENT ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) IS 'Creates a candidate info and candidate record in one transaction, using candidates_info.id as the candidate id.';

-- 10. Add helpful test query
-- SELECT * FROM candidates WHERE id = '<candidate_info_id>'; 