-- Fix Parsing Status and Job Questions Policies Migration
-- This migration fixes the parsing status constraint and adds missing RLS policies

-- ============================================================================
-- PART 1: Fix parsing status constraint
-- ============================================================================

-- Drop the old constraint
ALTER TABLE candidate_resumes DROP CONSTRAINT IF EXISTS candidate_resumes_parsing_status_check;

-- Add the new constraint with 'success' as a valid value
ALTER TABLE candidate_resumes 
ADD CONSTRAINT candidate_resumes_parsing_status_check 
CHECK (parsing_status IN ('pending', 'processing', 'success', 'completed', 'failed', 'error'));

-- ============================================================================
-- PART 2: Add missing RLS policies for job_questions
-- ============================================================================

-- Allow service role to manage job questions (needed for AI question generation)
CREATE POLICY "Service role can manage job questions" ON job_questions
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow job team members to manage questions
CREATE POLICY "Job team members can manage questions" ON job_questions
FOR ALL 
USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
        SELECT 1 FROM job_permissions jp 
        WHERE jp.job_id = job_questions.job_id 
        AND jp.user_id = auth.uid()
    )
)
WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
        SELECT 1 FROM job_permissions jp 
        WHERE jp.job_id = job_questions.job_id 
        AND jp.user_id = auth.uid()
    )
);

-- ============================================================================
-- PART 3: Update resume service parsing status
-- ============================================================================

-- Add comment explaining the parsing status values
COMMENT ON COLUMN candidate_resumes.parsing_status IS 
'Status of resume parsing: pending (initial), processing (in progress), success (completed successfully), completed (legacy), failed (parsing failed), error (system error)';

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

DO $$
DECLARE
    constraint_exists BOOLEAN;
    service_policy_exists BOOLEAN;
    team_policy_exists BOOLEAN;
    constraint_definition TEXT;
BEGIN
    -- Check if the new constraint exists and has correct values
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'candidate_resumes'::regclass 
        AND conname = 'candidate_resumes_parsing_status_check'
    ) INTO constraint_exists;
    
    -- Get constraint definition
    SELECT pg_get_constraintdef(oid) INTO constraint_definition
    FROM pg_constraint 
    WHERE conrelid = 'candidate_resumes'::regclass 
    AND conname = 'candidate_resumes_parsing_status_check';
    
    -- Check if service role policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_questions'
        AND policyname = 'Service role can manage job questions'
    ) INTO service_policy_exists;
    
    -- Check if team policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_questions'
        AND policyname = 'Job team members can manage questions'
    ) INTO team_policy_exists;
    
    RAISE NOTICE '✅ Parsing Status and Job Questions Policies Fix Applied';
    RAISE NOTICE '  - Parsing status constraint exists: %', constraint_exists;
    RAISE NOTICE '  - Constraint definition: %', constraint_definition;
    RAISE NOTICE '  - Service role policy exists: %', service_policy_exists;
    RAISE NOTICE '  - Team policy exists: %', team_policy_exists;
    
    IF constraint_exists AND service_policy_exists AND team_policy_exists THEN
        RAISE NOTICE '  - ✅ All fixes applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some fixes may need manual verification';
    END IF;
END $$; 