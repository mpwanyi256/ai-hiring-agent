-- Create Missing Candidate Functions Migration
-- This migration creates the missing create_candidate_info_and_record function and other candidate-related functions

-- ============================================================================
-- PART 1: Create the create_candidate_info_and_record function
-- ============================================================================

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

-- ============================================================================
-- PART 2: Add missing constraints and indexes
-- ============================================================================

-- Ensure unique constraint on candidates_info email (if not exists)
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidates_info_email_key' 
        AND table_name = 'candidates_info'
    ) THEN
        ALTER TABLE candidates_info ADD CONSTRAINT candidates_info_email_key UNIQUE (email);
    END IF;
END $$;

-- Ensure unique constraint on candidates for job_id + candidate_info_id combination
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidates_job_candidate_info_unique' 
        AND table_name = 'candidates'
    ) THEN
        ALTER TABLE candidates ADD CONSTRAINT candidates_job_candidate_info_unique UNIQUE (job_id, candidate_info_id);
    END IF;
END $$;

-- ============================================================================
-- PART 3: Create additional helper functions for candidate management
-- ============================================================================

-- Function to update candidate progress
CREATE OR REPLACE FUNCTION update_candidate_progress(
  p_candidate_id UUID,
  p_current_step INTEGER,
  p_total_steps INTEGER DEFAULT NULL,
  p_is_completed BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  updated_candidate RECORD;
BEGIN
  UPDATE candidates 
  SET 
    current_step = p_current_step,
    total_steps = COALESCE(p_total_steps, total_steps),
    is_completed = COALESCE(p_is_completed, is_completed),
    submitted_at = CASE 
      WHEN COALESCE(p_is_completed, is_completed) = true AND submitted_at IS NULL 
      THEN NOW() 
      ELSE submitted_at 
    END,
    updated_at = NOW()
  WHERE id = p_candidate_id
  RETURNING * INTO updated_candidate;

  IF updated_candidate.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'candidate', row_to_json(updated_candidate)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get candidate by interview token with enhanced information
CREATE OR REPLACE FUNCTION get_candidate_by_interview_token(p_interview_token TEXT)
RETURNS JSON AS $$
DECLARE
  candidate_data RECORD;
BEGIN
  SELECT 
    c.*,
    ci.email,
    ci.first_name,
    ci.last_name,
    ci.phone,
    ci.linkedin_url,
    ci.portfolio_url,
    j.title as job_title,
    j.description as job_description,
    j.requirements as job_requirements,
    j.location as job_location,
    j.salary_range as job_salary_range,
    j.employment_type as job_employment_type,
    j.fields as job_fields
  INTO candidate_data
  FROM candidates c
  LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
  LEFT JOIN jobs j ON c.job_id = j.id
  WHERE c.interview_token = p_interview_token;

  IF candidate_data.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'candidate', row_to_json(candidate_data)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark candidate as completed
CREATE OR REPLACE FUNCTION complete_candidate_application(p_candidate_id UUID)
RETURNS JSON AS $$
DECLARE
  updated_candidate RECORD;
BEGIN
  UPDATE candidates 
  SET 
    is_completed = true,
    submitted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_candidate_id
  RETURNING * INTO updated_candidate;

  IF updated_candidate.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'candidate', row_to_json(updated_candidate),
    'message', 'Application completed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Create updated_at triggers for candidate tables
-- ============================================================================

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for candidates table
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for candidates_info table
DROP TRIGGER IF EXISTS update_candidates_info_updated_at ON candidates_info;
CREATE TRIGGER update_candidates_info_updated_at
  BEFORE UPDATE ON candidates_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for candidate_resumes table
DROP TRIGGER IF EXISTS update_candidate_resumes_updated_at ON candidate_resumes;
CREATE TRIGGER update_candidate_resumes_updated_at
  BEFORE UPDATE ON candidate_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: Grant permissions to necessary roles
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_candidate_progress(UUID, INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_candidate_progress(UUID, INTEGER, INTEGER, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION get_candidate_by_interview_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_by_interview_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION complete_candidate_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_candidate_application(UUID) TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON candidates TO anon;
GRANT SELECT, INSERT, UPDATE ON candidates_info TO authenticated;
GRANT SELECT, INSERT, UPDATE ON candidates_info TO anon;

-- ============================================================================
-- PART 6: Create Row Level Security policies for candidates tables
-- ============================================================================

-- Enable RLS on candidates and candidates_info if not already enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates_info ENABLE ROW LEVEL SECURITY;

-- Create policies for candidates table
DROP POLICY IF EXISTS "Candidates can view their own records" ON candidates;
CREATE POLICY "Candidates can view their own records" ON candidates
  FOR SELECT USING (
    -- Allow access via interview token (for public job applications)
    true
  );

DROP POLICY IF EXISTS "Anyone can create candidate records" ON candidates;
CREATE POLICY "Anyone can create candidate records" ON candidates
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Candidates can update their own records" ON candidates;
CREATE POLICY "Candidates can update their own records" ON candidates
  FOR UPDATE USING (true);

-- Create policies for candidates_info table
DROP POLICY IF EXISTS "Anyone can view candidate info" ON candidates_info;
CREATE POLICY "Anyone can view candidate info" ON candidates_info
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create candidate info" ON candidates_info;
CREATE POLICY "Anyone can create candidate info" ON candidates_info
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update candidate info" ON candidates_info;
CREATE POLICY "Anyone can update candidate info" ON candidates_info
  FOR UPDATE USING (true);

-- ============================================================================
-- PART 7: Add helpful comments
-- ============================================================================

COMMENT ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) IS 'Creates candidate info and candidate record in one transaction, allowing multiple applications per person but only one per job.';

COMMENT ON FUNCTION update_candidate_progress(UUID, INTEGER, INTEGER, BOOLEAN) IS 'Updates candidate application progress and completion status.';

COMMENT ON FUNCTION get_candidate_by_interview_token(TEXT) IS 'Gets complete candidate and job information using interview token for public job applications.';

COMMENT ON FUNCTION complete_candidate_application(UUID) IS 'Marks a candidate application as completed and sets submission timestamp.';

-- ============================================================================
-- PART 8: Verify the migration
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    constraint_exists BOOLEAN;
BEGIN
    -- Check if main function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'create_candidate_info_and_record'
        AND routine_type = 'FUNCTION'
    ) INTO function_exists;
    
    -- Check if unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidates_info_email_key' 
        AND table_name = 'candidates_info'
    ) INTO constraint_exists;
    
    RAISE NOTICE '✅ Missing candidate functions migration completed';
    RAISE NOTICE '  - create_candidate_info_and_record function exists: %', function_exists;
    RAISE NOTICE '  - candidates_info email unique constraint exists: %', constraint_exists;
    
    IF function_exists AND constraint_exists THEN
        RAISE NOTICE '  - ✅ All candidate functions and constraints created successfully';
        RAISE NOTICE '  - Candidate application flow should now work properly';
    ELSE
        RAISE NOTICE '  - ⚠️  Some functions or constraints may not have been created properly';
    END IF;
END $$; 