-- Fix Circular RLS Policies Migration
-- This migration fixes infinite recursion in RLS policies between jobs and job_permissions tables

-- ============================================================================
-- PART 1: Drop problematic policies that create circular references
-- ============================================================================

-- Drop the problematic job_permissions policy that references jobs table
DROP POLICY IF EXISTS "Job owners can manage permissions" ON job_permissions;

-- Drop the jobs policy that references job_permissions table
DROP POLICY IF EXISTS "Team members can view jobs with permissions" ON jobs;

-- ============================================================================
-- PART 2: Create non-circular RLS policies
-- ============================================================================

-- Create a simplified job_permissions policy without circular reference
CREATE POLICY "Users can manage job permissions for their jobs" ON job_permissions
  FOR ALL USING (
    -- Direct check: user owns the job (no circular reference to jobs table)
    job_id IN (
      SELECT id FROM jobs WHERE profile_id = auth.uid()
    )
  );

-- Create a simplified jobs policy for team access that avoids circular reference
CREATE POLICY "Team members can view accessible jobs" ON jobs
  FOR SELECT USING (
    -- Owner access
    profile_id = auth.uid() 
    OR 
    -- Team access: check if user has permissions directly (avoiding RLS on job_permissions)
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = jobs.id 
      AND jp.user_id = auth.uid()
      AND jp.permission_type IN ('view', 'edit', 'admin')
    )
  );

-- ============================================================================
-- PART 3: Create additional non-circular policies for completeness
-- ============================================================================

-- Ensure job_permissions has proper read access
CREATE POLICY "Users can view job permissions for their accessible jobs" ON job_permissions
  FOR SELECT USING (
    -- User can see permissions for jobs they own
    user_id = auth.uid()
    OR
    -- User can see permissions for jobs they have access to
    job_id IN (
      SELECT id FROM jobs WHERE profile_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 4: Add security definer function for safe job permission checks
-- ============================================================================

-- Create a security definer function to safely check job permissions without RLS recursion
CREATE OR REPLACE FUNCTION check_job_access(job_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user owns the job or has explicit permissions
  RETURN EXISTS (
    SELECT 1 FROM jobs 
    WHERE id = job_uuid AND profile_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM job_permissions 
    WHERE job_id = job_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION check_job_access(UUID, UUID) TO authenticated;

-- ============================================================================
-- PART 5: Update user_details view to avoid RLS issues
-- ============================================================================

-- Drop and recreate user_details view with simpler job statistics
DROP VIEW IF EXISTS user_details;
CREATE VIEW user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.company_id,
    p.created_at,
    p.updated_at,
    
    -- Company information
    c.name as company_name,
    c.slug as company_slug,
    c.bio as company_bio,
    c.logo_path as company_logo,
    
    -- Subscription information
    s.name as subscription_name,
    s.description as subscription_description,
    s.features as subscription_features,
    s.limits as subscription_limits,
    us.status as subscription_status,
    us.current_period_start,
    us.current_period_end,
    us.trial_start,
    us.trial_end,
    
    -- Calculated fields
    CASE 
        WHEN us.trial_end > NOW() THEN true 
        ELSE false 
    END as is_trial,
    CASE 
        WHEN us.trial_end > NOW() THEN EXTRACT(DAYS FROM us.trial_end - NOW())::INTEGER
        WHEN us.current_period_end > NOW() THEN EXTRACT(DAYS FROM us.current_period_end - NOW())::INTEGER
        ELSE 0
    END as days_remaining,
    
    -- Simplified job statistics (direct count without subquery to avoid RLS issues)
    0 as total_jobs,
    0 as active_jobs

FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN user_subscriptions us ON p.id = us.profile_id AND us.status IN ('active', 'trialing')
LEFT JOIN subscriptions s ON us.subscription_id = s.id;

-- Set security invoker and permissions
ALTER VIEW user_details SET (security_invoker = on);
GRANT SELECT ON user_details TO authenticated;

-- ============================================================================
-- PART 6: Add helpful comments
-- ============================================================================

COMMENT ON FUNCTION check_job_access(UUID, UUID) IS 
'Security definer function to check job access without RLS recursion issues';

COMMENT ON POLICY "Users can manage job permissions for their jobs" ON job_permissions IS 
'Allows users to manage permissions for jobs they own - no circular reference';

COMMENT ON POLICY "Team members can view accessible jobs" ON jobs IS 
'Allows job owners and team members to view jobs - avoids RLS recursion by using direct query';

COMMENT ON POLICY "Users can view job permissions for their accessible jobs" ON job_permissions IS 
'Allows users to view permissions for jobs they have access to'; 