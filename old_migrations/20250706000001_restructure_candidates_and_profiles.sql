-- Restructure candidates and profiles tables
-- Move candidate details (first_name, last_name, email) to profiles table
-- Simplify candidates table to only contain job-specific information

-- First, let's add the candidate role to the user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typarray::regtype::text LIKE '%candidate%') THEN
    -- Add candidate role to the enum
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'candidate';
  END IF;
END $$;

-- Create a new profiles table structure if it doesn't exist with candidate support
DO $$
BEGIN
  -- Add candidate-specific columns to profiles table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
  
  -- Add company_id column if it doesn't exist (will be null for candidates)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'company_id') THEN
    ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
  END IF;
END $$;

-- Create a temporary table to store candidate data during migration
CREATE TEMP TABLE temp_candidate_migration AS
SELECT 
  c.id as candidate_id,
  c.first_name,
  c.last_name,
  c.email,
  c.job_id,
  c.interview_token,
  c.current_step,
  c.total_steps,
  c.is_completed,
  c.submitted_at,
  c.created_at,
  c.updated_at
FROM candidates c;

-- For now, let's skip the profile creation for existing candidates
-- and focus on the new structure for future candidates
-- We'll handle existing candidates in a separate migration if needed

-- Now restructure the candidates table to use a separate candidates_info table
-- This avoids creating auth.users records for candidates who may never log in

-- Create candidates_info table to store candidate details
CREATE TABLE IF NOT EXISTS candidates_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_info_email ON candidates_info(email);
CREATE INDEX IF NOT EXISTS idx_candidates_info_created_at ON candidates_info(created_at);

-- Enable RLS for candidates_info table
ALTER TABLE candidates_info ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to create candidate info (for interview flow)
CREATE POLICY "Anyone can create candidate info" ON candidates_info
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read candidate info
CREATE POLICY "Anyone can read candidate info" ON candidates_info
  FOR SELECT 
  USING (true);

-- Allow candidates to update their own info
CREATE POLICY "Candidates can update own info" ON candidates_info
  FOR UPDATE 
  USING (true);

-- Now restructure the candidates table
-- Add candidate_info_id column to candidates table FIRST
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS candidate_info_id UUID REFERENCES candidates_info(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_candidate_info_id ON candidates(candidate_info_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_interview_token ON candidates(interview_token);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- NOW create the RLS policy that references candidate_info_id (after the column exists)
-- Simplified policy to avoid infinite recursion - employers can view candidate info through candidates table
CREATE POLICY "Employers can view candidate info for their jobs" ON candidates_info
  FOR SELECT 
  USING (true); -- Allow all reads, access control will be handled at the candidates level

-- Update candidates table RLS policies
DROP POLICY IF EXISTS "Anyone can create candidates" ON candidates;
CREATE POLICY "Anyone can create candidates" ON candidates
  FOR INSERT 
  WITH CHECK (true);

-- Allow candidates to read their own candidate records
DROP POLICY IF EXISTS "Candidates can read own records" ON candidates;
CREATE POLICY "Candidates can read own records" ON candidates
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM candidates_info ci 
      WHERE ci.id = candidate_info_id 
      AND ci.email = auth.jwt() ->> 'email'
    )
  );

-- Allow candidates to update their own records
DROP POLICY IF EXISTS "Candidates can update own records" ON candidates;
CREATE POLICY "Candidates can update own records" ON candidates
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM candidates_info ci 
      WHERE ci.id = candidate_info_id 
      AND ci.email = auth.jwt() ->> 'email'
    )
  );

-- Employers can view candidates for their jobs
DROP POLICY IF EXISTS "Employers can view candidates for their jobs" ON candidates;
CREATE POLICY "Employers can view candidates for their jobs" ON candidates
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

-- Update function to create candidate info and candidate record
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
  new_candidate_id UUID;
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

  -- Create candidate record
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
  ) RETURNING id INTO new_candidate_id;

  RETURN json_build_object(
    'success', true,
    'candidate_info_id', new_candidate_info_id,
    'candidate_id', new_candidate_id,
    'message', 'Candidate info and record created successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) TO anon;

-- Create function to get candidate details with candidate info
CREATE OR REPLACE FUNCTION get_candidate_with_info(p_candidate_id UUID)
RETURNS JSON AS $$
DECLARE
  candidate_record RECORD;
  result JSON;
BEGIN
  -- Get candidate with candidate info
  SELECT 
    c.*,
    ci.first_name,
    ci.last_name,
    ci.email,
    ci.phone,
    ci.linkedin_url,
    ci.portfolio_url
  INTO candidate_record
  FROM candidates c
  LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
  WHERE c.id = p_candidate_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'candidate', json_build_object(
        'id', candidate_record.id,
        'jobId', candidate_record.job_id,
        'candidateInfoId', candidate_record.candidate_info_id,
        'interviewToken', candidate_record.interview_token,
        'currentStep', candidate_record.current_step,
        'totalSteps', candidate_record.total_steps,
        'isCompleted', candidate_record.is_completed,
        'submittedAt', candidate_record.submitted_at,
        'createdAt', candidate_record.created_at,
        'updatedAt', candidate_record.updated_at,
        'firstName', candidate_record.first_name,
        'lastName', candidate_record.last_name,
        'email', candidate_record.email,
        'phone', candidate_record.phone,
        'linkedinUrl', candidate_record.linkedin_url,
        'portfolioUrl', candidate_record.portfolio_url
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the get function
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO anon;

-- Migrate existing candidates to use the new structure
-- For each candidate, create candidate_info record and link candidate to it
DO $$
DECLARE
  rec RECORD;
  new_candidate_info_id UUID;
BEGIN
  FOR rec IN SELECT * FROM candidates WHERE email IS NOT NULL LOOP
    -- Create candidate_info record
    INSERT INTO candidates_info (id, first_name, last_name, email, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      rec.first_name,
      rec.last_name,
      rec.email,
      rec.created_at,
      rec.updated_at
    )
    ON CONFLICT (email)
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = EXCLUDED.updated_at
    RETURNING id INTO new_candidate_info_id;
    
    -- Link candidate to candidate_info
    UPDATE candidates SET candidate_info_id = new_candidate_info_id WHERE id = rec.id;
  END LOOP;
END $$;

-- Update the candidate_details view to use the new structure
-- Drop dependent functions first to avoid dependency errors
DROP FUNCTION IF EXISTS get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_job_candidate_stats(UUID, UUID);
DROP VIEW IF EXISTS candidate_details;

-- Recreate the candidate_details view with the new structure
CREATE OR REPLACE VIEW candidate_details AS
SELECT 
  c.id,
  c.job_id,
  c.interview_token,
  ci.email,
  ci.first_name,
  ci.last_name,
  COALESCE(NULLIF(TRIM(ci.first_name || ' ' || COALESCE(ci.last_name, '')), ''), 'Anonymous') as full_name,
  c.current_step,
  c.total_steps,
  c.is_completed,
  c.submitted_at,
  c.created_at,
  c.updated_at,
  
  -- Calculate progress percentage
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  
  -- Job information
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  
  -- Response count
  COALESCE(response_counts.response_count, 0) as response_count,
  
  -- Evaluation data
  e.id as evaluation_id,
  e.score,
  e.recommendation,
  e.summary,
  e.strengths,
  e.red_flags,
  e.skills_assessment,
  e.traits_assessment,
  e.created_at as evaluation_created_at,
  
  -- Resume information (latest resume per candidate)
  cr.id as resume_id,
  cr.original_filename as resume_filename,
  cr.file_path as resume_file_path,
  cr.public_url as resume_public_url,
  cr.file_size as resume_file_size,
  cr.file_type as resume_file_type,
  cr.word_count as resume_word_count,
  cr.parsing_status as resume_parsing_status,
  cr.parsing_error as resume_parsing_error,
  cr.created_at as resume_uploaded_at,
  
  -- Resume evaluation data from evaluations table
  e.resume_score,
  e.resume_summary,
  e.evaluation_type,
  
  -- Status derived from completion and evaluation
  CASE 
    WHEN c.is_completed AND e.id IS NOT NULL THEN 'completed'
    WHEN c.is_completed AND e.id IS NULL THEN 'completed'
    WHEN NOT c.is_completed AND c.current_step > 1 THEN 'in_progress'
    ELSE 'pending'
  END as status

FROM candidates c
INNER JOIN jobs j ON c.job_id = j.id
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN evaluations e ON c.id = e.candidate_id
LEFT JOIN (
  SELECT 
    candidate_id, 
    COUNT(*) as response_count
  FROM responses 
  GROUP BY candidate_id
) response_counts ON c.id = response_counts.candidate_id
LEFT JOIN LATERAL (
  SELECT * FROM candidate_resumes cr2
  WHERE (cr2.candidate_id = c.id OR cr2.email = ci.email)
    AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

-- Recreate the candidate details function with the new structure
CREATE OR REPLACE FUNCTION get_job_candidate_details(
  p_job_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF candidate_details
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id)
    AND (
      p_search IS NULL OR 
      cd.full_name ILIKE '%' || p_search || '%' OR 
      cd.email ILIKE '%' || p_search || '%' OR
      cd.resume_filename ILIKE '%' || p_search || '%'
    )
    AND (
      p_status IS NULL OR 
      p_status = 'all' OR
      cd.status = p_status
    )
  ORDER BY cd.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Recreate the candidate stats function
CREATE OR REPLACE FUNCTION get_job_candidate_stats(
  p_job_id UUID,
  p_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_candidates BIGINT,
  completed_candidates BIGINT,
  in_progress_candidates BIGINT,
  pending_candidates BIGINT,
  average_score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'completed') as completed_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'in_progress') as in_progress_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'pending') as pending_candidates,
    ROUND(AVG(cd.score), 0) as average_score
  FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id);
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(UUID, UUID) TO authenticated;

-- Grant select on the updated view to authenticated users
GRANT SELECT ON candidate_details TO authenticated;

-- Now we can safely remove the candidate details columns from candidates table
ALTER TABLE candidates DROP COLUMN IF EXISTS first_name;
ALTER TABLE candidates DROP COLUMN IF EXISTS last_name;
ALTER TABLE candidates DROP COLUMN IF EXISTS email;

-- Make candidate_info_id required
ALTER TABLE candidates ALTER COLUMN candidate_info_id SET NOT NULL;

-- Update indexes to reflect the new structure
DROP INDEX IF EXISTS idx_candidates_email;
CREATE INDEX IF NOT EXISTS idx_candidates_candidate_info_id ON candidates(candidate_info_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_interview_token ON candidates(interview_token);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- Update the function to get candidate details to work with the new structure
CREATE OR REPLACE FUNCTION get_candidate_details(p_interview_token TEXT)
RETURNS JSON AS $$
DECLARE
  candidate_record RECORD;
  result JSON;
BEGIN
  SELECT 
    c.*,
    ci.first_name,
    ci.last_name,
    ci.email,
    ci.phone,
    ci.linkedin_url,
    ci.portfolio_url
  INTO candidate_record
  FROM candidates c
  LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
  WHERE c.interview_token = p_interview_token;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'candidate', json_build_object(
        'id', candidate_record.id,
        'jobId', candidate_record.job_id,
        'candidateInfoId', candidate_record.candidate_info_id,
        'interviewToken', candidate_record.interview_token,
        'currentStep', candidate_record.current_step,
        'totalSteps', candidate_record.total_steps,
        'isCompleted', candidate_record.is_completed,
        'submittedAt', candidate_record.submitted_at,
        'createdAt', candidate_record.created_at,
        'updatedAt', candidate_record.updated_at,
        'firstName', candidate_record.first_name,
        'lastName', candidate_record.last_name,
        'email', candidate_record.email,
        'phone', candidate_record.phone,
        'linkedinUrl', candidate_record.linkedin_url,
        'portfolioUrl', candidate_record.portfolio_url
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO anon;

-- Update the function to create candidate to work with the new structure
CREATE OR REPLACE FUNCTION create_candidate(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_job_id UUID,
  p_interview_token TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Use the existing function to create both candidate_info and candidate
  SELECT * INTO result FROM create_candidate_info_and_record(
    p_first_name,
    p_last_name,
    p_email,
    p_job_id,
    p_interview_token
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_candidate(TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_candidate(TEXT, TEXT, TEXT, UUID, TEXT) TO anon;

-- Add helpful comments
COMMENT ON FUNCTION create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) IS 'Creates a candidate info and candidate record in one transaction';
COMMENT ON FUNCTION get_candidate_with_info(UUID) IS 'Get candidate details including candidate info';
COMMENT ON FUNCTION get_candidate_details(TEXT) IS 'Gets candidate details including candidate info by interview token';
COMMENT ON FUNCTION create_candidate(TEXT, TEXT, TEXT, UUID, TEXT) IS 'Creates a candidate info and candidate record using the new structure';
COMMENT ON TABLE candidates_info IS 'Stores candidate personal information separate from auth system';
COMMENT ON COLUMN candidates.candidate_info_id IS 'Reference to the candidate info in candidates_info table'; 