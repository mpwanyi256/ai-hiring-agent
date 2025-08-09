-- Migration: Fix candidate_analytics RLS for authenticator role (API)
-- This migration allows the authenticator role (used by PostgREST/API) to insert/update analytics for the correct job/candidate

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Authenticator can insert candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Authenticator can update candidate analytics" ON candidate_analytics;

-- Allow authenticator to insert analytics for jobs they are associated with
CREATE POLICY "Authenticator can insert candidate analytics" ON candidate_analytics
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticator' AND
    job_id IN (SELECT id FROM jobs WHERE profile_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Allow authenticator to update analytics for jobs they are associated with
CREATE POLICY "Authenticator can update candidate analytics" ON candidate_analytics
  FOR UPDATE USING (
    auth.role() = 'authenticator' AND
    job_id IN (SELECT id FROM jobs WHERE profile_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Add helpful comments
COMMENT ON POLICY "Authenticator can insert candidate analytics" ON candidate_analytics IS 'Allows authenticator (API) and service_role to insert analytics for jobs they own.';
COMMENT ON POLICY "Authenticator can update candidate analytics" ON candidate_analytics IS 'Allows authenticator (API) and service_role to update analytics for jobs they own.'; 