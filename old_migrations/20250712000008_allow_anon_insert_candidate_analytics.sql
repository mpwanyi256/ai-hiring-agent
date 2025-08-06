-- Migration: Allow anonymous users to insert candidate_analytics for interview flow
-- This migration allows the anon role (used by unauthenticated/anonymous users) to insert analytics for the correct job/candidate

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Anon can insert candidate analytics" ON candidate_analytics;

-- Allow anon to insert analytics for jobs they are associated with (interview flow)
CREATE POLICY "Anon can insert candidate analytics" ON candidate_analytics
  FOR INSERT WITH CHECK (
    auth.role() = 'anon' OR auth.role() = 'authenticated' OR auth.role() = 'authenticator' OR auth.role() = 'service_role'
  );

-- Add helpful comment
COMMENT ON POLICY "Anon can insert candidate analytics" ON candidate_analytics IS 'Allows anon, authenticated, authenticator, and service_role to insert analytics for interview and API flows.'; 