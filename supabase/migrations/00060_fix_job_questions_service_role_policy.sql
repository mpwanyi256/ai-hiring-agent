-- Fix Job Questions Service Role Policy Migration
-- This migration fixes the service role policy for job_questions to allow question creation in dashboard

-- ============================================================================
-- PART 1: Drop and recreate the service role policy with correct syntax
-- ============================================================================

-- Drop the existing service role policy
DROP POLICY IF EXISTS "Service role can manage job questions" ON job_questions;

-- Create a more specific service role policy
CREATE POLICY "Service role full access" ON job_questions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 2: Ensure authenticated users can also manage questions for their jobs
-- ============================================================================

-- Drop and recreate the job team members policy to be more permissive
DROP POLICY IF EXISTS "Job team members can manage questions" ON job_questions;

CREATE POLICY "Job creators and team members can manage questions" ON job_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM jobs j 
        WHERE j.id = job_questions.job_id 
        AND (
            j.profile_id = auth.uid() OR  -- Job creator
            EXISTS (
                SELECT 1 FROM job_permissions jp 
                WHERE jp.job_id = j.id 
                AND jp.user_id = auth.uid()
            )  -- Team member with permissions
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jobs j 
        WHERE j.id = job_questions.job_id 
        AND (
            j.profile_id = auth.uid() OR  -- Job creator
            EXISTS (
                SELECT 1 FROM job_permissions jp 
                WHERE jp.job_id = j.id 
                AND jp.user_id = auth.uid()
            )  -- Team member with permissions
        )
    )
);

-- ============================================================================
-- PART 3: Ensure the anonymous policy is correct for reading only
-- ============================================================================

-- Update the anonymous policy to be more explicit
DROP POLICY IF EXISTS "Anyone can read questions for active jobs" ON job_questions;
DROP POLICY IF EXISTS "Anonymous users can read job questions for active jobs" ON job_questions;

CREATE POLICY "Anonymous users can read questions for active jobs" ON job_questions
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM jobs j 
        WHERE j.id = job_questions.job_id 
        AND j.is_active = true
    )
);

-- ============================================================================
-- PART 4: Grant necessary permissions to service_role
-- ============================================================================

-- Grant all necessary permissions to service_role
GRANT ALL ON job_questions TO service_role;

-- ============================================================================
-- PART 5: Verification
-- ============================================================================

DO $$
DECLARE
    service_role_policy_exists BOOLEAN;
    authenticated_policy_exists BOOLEAN;
    anon_policy_exists BOOLEAN;
BEGIN
    -- Check if service role policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_questions'
        AND policyname = 'Service role full access'
    ) INTO service_role_policy_exists;
    
    -- Check if authenticated policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_questions'
        AND policyname = 'Job creators and team members can manage questions'
    ) INTO authenticated_policy_exists;
    
    -- Check if anon policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_questions'
        AND policyname = 'Anonymous users can read questions for active jobs'
    ) INTO anon_policy_exists;
    
    RAISE NOTICE '✅ Job Questions RLS Policies Fixed';
    RAISE NOTICE '  - Service role policy exists: %', service_role_policy_exists;
    RAISE NOTICE '  - Authenticated policy exists: %', authenticated_policy_exists;
    RAISE NOTICE '  - Anonymous policy exists: %', anon_policy_exists;
    
    IF service_role_policy_exists AND authenticated_policy_exists AND anon_policy_exists THEN
        RAISE NOTICE '  - ✅ All policies applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some policies may need manual verification';
    END IF;
END $$; 