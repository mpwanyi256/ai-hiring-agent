-- Migration: Unify candidate_analytics RLS for all interview flows
-- Drops all existing insert/update policies and creates a single permissive policy for all relevant roles

-- Drop all existing insert/update policies
DROP POLICY IF EXISTS "Service role can insert candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Service role can update candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "System can insert candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "System can update candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Authenticator can insert candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Authenticator can update candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Anon can insert candidate analytics" ON candidate_analytics;
DROP POLICY IF EXISTS "Anon can update candidate analytics" ON candidate_analytics;

-- Create a single policy for all relevant roles
CREATE POLICY "Anyone can insert candidate analytics" ON candidate_analytics
  FOR INSERT WITH CHECK (
    auth.role() IN ('anon', 'authenticated', 'authenticator', 'service_role')
  );

CREATE POLICY "Anyone can update candidate analytics" ON candidate_analytics
  FOR UPDATE USING (
    auth.role() IN ('anon', 'authenticated', 'authenticator', 'service_role')
  );

-- Add helpful comments
COMMENT ON POLICY "Anyone can insert candidate analytics" ON candidate_analytics IS 'Allows all relevant roles (anon, authenticated, authenticator, service_role) to insert analytics for interview and API flows.';
COMMENT ON POLICY "Anyone can update candidate analytics" ON candidate_analytics IS 'Allows all relevant roles (anon, authenticated, authenticator, service_role) to update analytics for interview and API flows.'; 