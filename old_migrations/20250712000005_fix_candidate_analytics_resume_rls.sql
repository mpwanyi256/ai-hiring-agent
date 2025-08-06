-- Migration: Fix candidate_analytics RLS for resume evaluation and clean up
-- 1. Ensure candidate_analytics allows inserts/updates from service_role and for resume evaluation
-- 2. Ensure candidate_resumes and analytics tables have correct RLS for resume evaluation
-- 3. Clean up duplicate/conflicting policies

-- Drop conflicting or duplicate policies
DROP POLICY IF EXISTS "System can insert candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "System can update candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Anyone can upload resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Anyone can read resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Employers can view resumes for their jobs" ON candidate_resumes;
DROP POLICY IF EXISTS "Service role can update resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Users can view candidate analytics for their jobs" ON candidate_analytics;

-- Recreate candidate_analytics policies
CREATE POLICY "Service role can insert candidate analytics" ON candidate_analytics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update candidate analytics" ON candidate_analytics
  FOR UPDATE USING (auth.role() = 'service_role');

-- Allow authenticated users to view analytics for their jobs
CREATE POLICY "Users can view candidate analytics for their jobs" ON candidate_analytics
  FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE profile_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Recreate candidate_resumes policies for interview flow
CREATE POLICY "Anyone can upload resumes" ON candidate_resumes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read resumes" ON candidate_resumes
  FOR SELECT USING (true);
CREATE POLICY "Employers can view resumes for their jobs" ON candidate_resumes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id AND p.id = auth.uid()
    )
  );
CREATE POLICY "Service role can update resumes" ON candidate_resumes
  FOR UPDATE USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON candidate_analytics TO service_role;
GRANT ALL ON candidate_resumes TO service_role;
GRANT SELECT ON candidate_analytics TO authenticated;
GRANT SELECT ON candidate_resumes TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Service role can insert candidate analytics" ON candidate_analytics IS 'Allows service_role to insert analytics, including from resume evaluation.';
COMMENT ON POLICY "Service role can update candidate analytics" ON candidate_analytics IS 'Allows service_role to update analytics, including from resume evaluation.';
COMMENT ON POLICY "Anyone can upload resumes" ON candidate_resumes IS 'Allows anonymous and authenticated users to upload resumes for interview flow.';
COMMENT ON POLICY "Anyone can read resumes" ON candidate_resumes IS 'Allows all users to read their own resumes.';
COMMENT ON POLICY "Employers can view resumes for their jobs" ON candidate_resumes IS 'Allows employers to view resumes for their jobs.';
COMMENT ON POLICY "Service role can update resumes" ON candidate_resumes IS 'Allows service_role to update resumes for processing status.'; 