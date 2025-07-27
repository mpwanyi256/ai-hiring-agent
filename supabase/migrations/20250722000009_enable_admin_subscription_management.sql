-- Migration: Enable admin subscription management
-- Description: Add RLS policies and permissions to allow admin users to manage subscriptions

-- First, ensure RLS is enabled on the subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;

-- Note: Keep the existing "Everyone can view subscription plans" policy
-- This ensures that non-authenticated users can still view available plans

-- Create admin-specific RLS policies for subscriptions table

-- Admins can view all subscriptions (in addition to the public view policy)
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert new subscriptions
CREATE POLICY "Admins can insert subscriptions" ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update existing subscriptions
CREATE POLICY "Admins can update subscriptions" ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete subscriptions
CREATE POLICY "Admins can delete subscriptions" ON subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get platform statistics (admin only)
CREATE OR REPLACE FUNCTION get_platform_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_users INTEGER;
  new_users_this_month INTEGER;
  active_subscriptions INTEGER;
  total_revenue NUMERIC;
  total_companies INTEGER;
  active_jobs INTEGER;
  completed_interviews INTEGER;
  total_candidates INTEGER;
  first_day_of_month DATE;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Calculate first day of current month
  first_day_of_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Get total users
  SELECT COUNT(*) INTO total_users FROM profiles;

  -- Get new users this month
  SELECT COUNT(*) INTO new_users_this_month 
  FROM profiles 
  WHERE created_at >= first_day_of_month;

  -- Get active subscriptions
  SELECT COUNT(*) INTO active_subscriptions 
  FROM user_subscriptions 
  WHERE status = 'active';

  -- Calculate total revenue (simplified - monthly revenue from active subscriptions)
  SELECT COALESCE(SUM(s.price_monthly), 0) INTO total_revenue
  FROM user_subscriptions us
  JOIN subscriptions s ON us.subscription_id = s.id
  WHERE us.status = 'active';

  -- Get total companies
  SELECT COUNT(*) INTO total_companies FROM companies;

  -- Get active jobs
  SELECT COUNT(*) INTO active_jobs 
  FROM jobs 
  WHERE status = 'interviewing';

  -- Get completed interviews
  SELECT COUNT(*) INTO completed_interviews 
  FROM interviews 
  WHERE status = 'completed';

  -- Get total candidates
  SELECT COUNT(*) INTO total_candidates FROM candidates;

  -- Build result JSON
  result := json_build_object(
    'totalUsers', total_users,
    'newUsersThisMonth', new_users_this_month,
    'activeSubscriptions', active_subscriptions,
    'totalRevenue', total_revenue,
    'totalCompanies', total_companies,
    'activeJobs', active_jobs,
    'completedInterviews', completed_interviews,
    'totalCandidates', total_candidates
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_statistics() TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if the current user has admin role';
COMMENT ON FUNCTION get_platform_statistics() IS 'Returns platform-wide statistics for admin dashboard (admin only)';
COMMENT ON POLICY "Everyone can view subscription plans" ON subscriptions IS 'Allows public access to view subscription plans for pricing pages';
COMMENT ON POLICY "Admins can view all subscriptions" ON subscriptions IS 'Allows admins to view all subscription details for management';
COMMENT ON POLICY "Admins can insert subscriptions" ON subscriptions IS 'Allows admins to create new subscription plans';
COMMENT ON POLICY "Admins can update subscriptions" ON subscriptions IS 'Allows admins to modify existing subscription plans';
COMMENT ON POLICY "Admins can delete subscriptions" ON subscriptions IS 'Allows admins to remove subscription plans'; 