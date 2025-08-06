-- Migration: Fix duplicate policy error for candidate_analytics
-- Drop the policy before recreating to avoid SQLSTATE 42710

DROP POLICY IF EXISTS "Users can view candidate analytics for their jobs" ON candidate_analytics;

CREATE POLICY "Users can view candidate analytics for their jobs" ON candidate_analytics
  FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE profile_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Add helpful comment
COMMENT ON POLICY "Users can view candidate analytics for their jobs" ON candidate_analytics IS 'Allows authenticated users and service_role to view analytics for their jobs.'; 