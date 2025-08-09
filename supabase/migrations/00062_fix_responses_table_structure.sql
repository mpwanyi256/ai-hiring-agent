-- Fix Responses Table Structure Migration
-- This migration fixes the responses table structure and RLS policies based on old migrations

-- ============================================================================
-- PART 1: Add missing columns to responses table
-- ============================================================================

-- Add job_id column if it doesn't exist (required by API)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;

-- Add profile_id column if it doesn't exist (for better RLS)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add question_text column if it doesn't exist (for storing question text)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS question_text TEXT;

-- Ensure question_id is TEXT type (as per old migrations)
DO $$
BEGIN
    -- Check if question_id is UUID and convert to TEXT if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'responses' 
        AND column_name = 'question_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop the existing column and recreate as TEXT
        ALTER TABLE responses DROP COLUMN question_id;
        ALTER TABLE responses ADD COLUMN question_id TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- ============================================================================
-- PART 2: Create indexes for better performance
-- ============================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_responses_job_id ON responses(job_id);
CREATE INDEX IF NOT EXISTS idx_responses_profile_id ON responses(profile_id);
CREATE INDEX IF NOT EXISTS idx_responses_candidate_id ON responses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_responses_job_question_id ON responses(job_question_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);

-- ============================================================================
-- PART 3: Fix RLS policies based on old migrations
-- ============================================================================

-- Drop existing policies that might be incorrect
DROP POLICY IF EXISTS "Anonymous users can create responses" ON responses;
DROP POLICY IF EXISTS "Candidates can create their own responses" ON responses;
DROP POLICY IF EXISTS "Candidates can read their own responses" ON responses;
DROP POLICY IF EXISTS "Employers can view responses for their jobs" ON responses;

-- Allow anonymous users to insert responses (for interview flow)
CREATE POLICY "Anonymous users can create responses" ON responses
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read responses (for interview flow)
CREATE POLICY "Anonymous users can read responses" ON responses
  FOR SELECT 
  USING (true);

-- Allow candidates to read their own responses (when authenticated)
CREATE POLICY "Candidates can read their own responses" ON responses
  FOR SELECT 
  USING (
    profile_id = auth.uid()
    OR auth.role() = 'anon' -- Allow anonymous access for interview flow
  );

-- Employers can view responses for candidates applying to their jobs
CREATE POLICY "Employers can view responses for their job candidates" ON responses
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      JOIN profiles p ON j.profile_id = p.id
      WHERE c.id = responses.candidate_id 
      AND p.id = auth.uid()
    )
  );

-- Employers can view responses by job_id (when job_id is available)
CREATE POLICY "Employers can view responses for their jobs" ON responses
  FOR SELECT 
  USING (
    job_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = responses.job_id 
      AND p.id = auth.uid()
    )
  );

-- Service role can manage all responses
CREATE POLICY "Service role can manage responses" ON responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 4: Grant necessary permissions
-- ============================================================================

-- Grant permissions to anon role for interview flow
GRANT SELECT, INSERT ON responses TO anon;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON responses TO authenticated;

-- Grant all permissions to service_role
GRANT ALL ON responses TO service_role;

-- ============================================================================
-- PART 5: Create helper function to populate job_id from candidate_id
-- ============================================================================

-- Function to populate job_id for existing responses
CREATE OR REPLACE FUNCTION populate_responses_job_id()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update responses that have candidate_id but no job_id
  UPDATE responses 
  SET job_id = c.job_id
  FROM candidates c
  WHERE responses.candidate_id = c.id 
    AND responses.job_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % responses with job_id', updated_count;
END;
$$;

-- Execute the function to populate job_id
SELECT populate_responses_job_id();

-- Drop the helper function
DROP FUNCTION populate_responses_job_id();

-- ============================================================================
-- PART 6: Verification
-- ============================================================================

DO $$
DECLARE
    job_id_exists BOOLEAN;
    profile_id_exists BOOLEAN;
    question_text_exists BOOLEAN;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check if required columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'responses' AND column_name = 'job_id'
    ) INTO job_id_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'responses' AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'responses' AND column_name = 'question_text'
    ) INTO question_text_exists;

    -- Check policy count
    SELECT COUNT(*) FROM pg_policies
    WHERE tablename = 'responses'
    INTO policy_count;

    -- Check index count
    SELECT COUNT(*) FROM pg_indexes
    WHERE tablename = 'responses'
    INTO index_count;

    RAISE NOTICE '✅ Responses Table Structure Fix Applied';
    RAISE NOTICE '  - job_id column exists: %', job_id_exists;
    RAISE NOTICE '  - profile_id column exists: %', profile_id_exists;
    RAISE NOTICE '  - question_text column exists: %', question_text_exists;
    RAISE NOTICE '  - RLS policies count: %', policy_count;
    RAISE NOTICE '  - Indexes count: %', index_count;

    IF job_id_exists AND profile_id_exists AND question_text_exists AND policy_count >= 5 THEN
        RAISE NOTICE '  - ✅ All responses table fixes applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some fixes may need manual verification';
    END IF;
END $$; 