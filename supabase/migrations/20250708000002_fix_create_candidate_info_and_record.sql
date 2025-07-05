-- Fix create_candidate_info_and_record to prevent duplicate candidates for the same job and candidate_info_id
-- Only create a new candidate if one does not already exist for the job and candidate_info_id

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

  -- Create candidate record if not found
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

-- Add helpful comment
COMMENT ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) IS 'Creates a candidate info and candidate record in one transaction, but only one candidate per job and candidate_info_id.'; 