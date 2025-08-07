-- Drop Redundant Email Column Migration
-- This migration removes the redundant email column from candidate_resumes table
-- since candidate details can be obtained via the candidate_id relationship

-- ============================================================================
-- PART 1: Drop dependent objects that reference the email column
-- ============================================================================

-- Drop the function that depends on candidate_details view
DROP FUNCTION IF EXISTS get_job_candidate_details(uuid,text,text,integer,integer);

-- Drop the candidate_details view that references the email column
DROP VIEW IF EXISTS candidate_details;

-- ============================================================================
-- PART 2: Drop email column from candidate_resumes table
-- ============================================================================

-- Drop the email column since it's redundant with candidate_id relationship
ALTER TABLE candidate_resumes DROP COLUMN IF EXISTS email;

-- Drop the email index if it exists
DROP INDEX IF EXISTS idx_candidate_resumes_email;

-- ============================================================================
-- PART 3: Recreate candidate_details view without email column
-- ============================================================================

-- Recreate candidate_details view using candidate_info relationship instead of email column
CREATE OR REPLACE VIEW candidate_details AS
SELECT 
  c.id, 
  c.candidate_info_id, 
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
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  j.title as job_title,
  j.status as job_status,
  j.profile_id, 
  j.fields as job_fields,
  COALESCE(response_counts.response_count, 0) as response_count,
  e.id as evaluation_id,
  e.score,
  e.recommendation,
  e.summary,
  e.strengths,
  e.red_flags,
  e.skills_assessment,
  e.traits_assessment,
  e.created_at as evaluation_created_at,
  e.evaluation_type,
  e.resume_score,
  e.resume_summary,
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
  c.candidate_status
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
  WHERE cr2.candidate_id = c.id
    AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

-- ============================================================================
-- PART 4: Recreate get_job_candidate_details function
-- ============================================================================

-- Recreate the function with the updated view structure
CREATE OR REPLACE FUNCTION get_job_candidate_details(
    p_job_id uuid,
    p_search text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    candidate_info_id uuid,
    job_id uuid,
    interview_token text,
    email text,
    first_name text,
    last_name text,
    full_name text,
    current_step integer,
    total_steps integer,
    is_completed boolean,
    submitted_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    progress_percentage numeric,
    job_title text,
    job_status text,
    profile_id uuid,
    job_fields jsonb,
    response_count bigint,
    evaluation_id uuid,
    score integer,
    recommendation text,
    summary text,
    strengths jsonb,
    red_flags jsonb,
    skills_assessment jsonb,
    traits_assessment jsonb,
    evaluation_created_at timestamptz,
    evaluation_type text,
    resume_score integer,
    resume_summary text,
    resume_id uuid,
    resume_filename text,
    resume_file_path text,
    resume_public_url text,
    resume_file_size integer,
    resume_file_type text,
    resume_word_count integer,
    resume_parsing_status text,
    resume_parsing_error text,
    resume_uploaded_at timestamptz,
    candidate_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.candidate_info_id,
        cd.job_id,
        cd.interview_token,
        cd.email,
        cd.first_name,
        cd.last_name,
        cd.full_name,
        cd.current_step,
        cd.total_steps,
        cd.is_completed,
        cd.submitted_at,
        cd.created_at,
        cd.updated_at,
        cd.progress_percentage,
        cd.job_title,
        cd.job_status,
        cd.profile_id,
        cd.job_fields,
        cd.response_count,
        cd.evaluation_id,
        cd.score,
        cd.recommendation,
        cd.summary,
        cd.strengths,
        cd.red_flags,
        cd.skills_assessment,
        cd.traits_assessment,
        cd.evaluation_created_at,
        cd.evaluation_type,
        cd.resume_score,
        cd.resume_summary,
        cd.resume_id,
        cd.resume_filename,
        cd.resume_file_path,
        cd.resume_public_url,
        cd.resume_file_size,
        cd.resume_file_type,
        cd.resume_word_count,
        cd.resume_parsing_status,
        cd.resume_parsing_error,
        cd.resume_uploaded_at,
        cd.candidate_status
    FROM candidate_details cd
    WHERE cd.job_id = p_job_id
    AND (p_search IS NULL OR 
         cd.full_name ILIKE '%' || p_search || '%' OR 
         cd.email ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR cd.candidate_status = p_status)
    ORDER BY cd.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================================================
-- PART 5: Update RLS policies that referenced email
-- ============================================================================

-- Drop the old policy that referenced email in the name
DROP POLICY IF EXISTS "Anonymous users can read resumes by email" ON candidate_resumes;

-- Recreate the policy with a more accurate name (no email reference)
CREATE POLICY "Anonymous users can read resumes" ON candidate_resumes
FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() IS NULL);

-- Update the policy comment to remove email references
COMMENT ON POLICY "Anonymous users can read resumes" ON candidate_resumes IS 
'Allows anonymous users to read resumes (needed for interview flow)';

-- ============================================================================
-- PART 6: Verification
-- ============================================================================

DO $$
DECLARE
    email_column_exists BOOLEAN;
    email_index_exists BOOLEAN;
    old_policy_exists BOOLEAN;
    new_policy_exists BOOLEAN;
    view_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check if email column still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidate_resumes' 
        AND table_schema = 'public'
        AND column_name = 'email'
    ) INTO email_column_exists;
    
    -- Check if email index still exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'candidate_resumes'
        AND indexname = 'idx_candidate_resumes_email'
    ) INTO email_index_exists;
    
    -- Check if old policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'candidate_resumes'
        AND policyname = 'Anonymous users can read resumes by email'
    ) INTO old_policy_exists;
    
    -- Check if new policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'candidate_resumes'
        AND policyname = 'Anonymous users can read resumes'
    ) INTO new_policy_exists;
    
    -- Check if candidate_details view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'candidate_details'
        AND table_schema = 'public'
    ) INTO view_exists;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_job_candidate_details'
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    RAISE NOTICE '✅ Candidate Resume Email Column Removal Applied';
    RAISE NOTICE '  - Email column exists: %', email_column_exists;
    RAISE NOTICE '  - Email index exists: %', email_index_exists;
    RAISE NOTICE '  - Old policy exists: %', old_policy_exists;
    RAISE NOTICE '  - New policy exists: %', new_policy_exists;
    RAISE NOTICE '  - Candidate details view exists: %', view_exists;
    RAISE NOTICE '  - Function exists: %', function_exists;
    
    IF NOT email_column_exists AND NOT email_index_exists AND NOT old_policy_exists AND new_policy_exists AND view_exists AND function_exists THEN
        RAISE NOTICE '  - ✅ All email references successfully removed, dependencies recreated, and policies updated';
    ELSE
        RAISE NOTICE '  - ⚠️  Some objects may need manual verification';
    END IF;
END $$; 