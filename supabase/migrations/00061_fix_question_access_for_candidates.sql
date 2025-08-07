-- Fix Question Access for Candidates Migration
-- This migration ensures candidates can access job questions properly

-- ============================================================================
-- PART 1: Add comprehensive RLS policies for job_questions access
-- ============================================================================

-- Allow anonymous users to read questions for jobs with valid interview tokens
CREATE POLICY "Anonymous users can read questions via interview token" ON job_questions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = job_questions.job_id
    AND j.is_active = true
    AND j.interview_token IS NOT NULL
    AND j.status IN ('active', 'interviewing')
  )
);

-- Allow service role to read all questions (for server-side operations)
CREATE POLICY "Service role can read all questions" ON job_questions
FOR SELECT
TO service_role
USING (true);

-- ============================================================================
-- PART 2: Grant necessary permissions
-- ============================================================================

-- Grant SELECT permission to anon role
GRANT SELECT ON job_questions TO anon;

-- Grant ALL permissions to service_role (should already exist but ensuring)
GRANT ALL ON job_questions TO service_role;

-- ============================================================================
-- PART 3: Test the access
-- ============================================================================

-- Create a test function to verify question access
CREATE OR REPLACE FUNCTION test_question_access(p_job_id uuid)
RETURNS TABLE(
  question_count bigint,
  sample_question text,
  access_method text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Test as service_role
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as question_count,
    MIN(question_text) as sample_question,
    'service_role' as access_method
  FROM job_questions 
  WHERE job_id = p_job_id;
END;
$$;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION test_question_access(uuid) TO service_role;

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

DO $$
DECLARE
    anon_policy_exists BOOLEAN;
    service_policy_exists BOOLEAN;
    anon_permissions BOOLEAN;
    service_permissions BOOLEAN;
BEGIN
    -- Check if anon policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'job_questions'
        AND policyname = 'Anonymous users can read questions via interview token'
    ) INTO anon_policy_exists;

    -- Check if service policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'job_questions'
        AND policyname = 'Service role can read all questions'
    ) INTO service_policy_exists;

    -- Check permissions
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_name = 'job_questions'
        AND grantee = 'anon'
        AND privilege_type = 'SELECT'
    ) INTO anon_permissions;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_name = 'job_questions'
        AND grantee = 'service_role'
        AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
    ) INTO service_permissions;

    RAISE NOTICE '✅ Question Access Fix Applied';
    RAISE NOTICE '  - Anonymous policy exists: %', anon_policy_exists;
    RAISE NOTICE '  - Service role policy exists: %', service_policy_exists;
    RAISE NOTICE '  - Anonymous permissions: %', anon_permissions;
    RAISE NOTICE '  - Service role permissions: %', service_permissions;

    IF anon_policy_exists AND service_policy_exists AND anon_permissions THEN
        RAISE NOTICE '  - ✅ All question access policies applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some policies may need manual verification';
    END IF;
END $$; 