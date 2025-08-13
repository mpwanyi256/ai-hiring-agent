-- 00133_recreate_platform_stats_and_public_signed_contracts.sql
-- Recreate admin helper/statistics functions and make 'signed-contracts' bucket public

-- Ensure we are in the public schema for functions
SET search_path = public;

-- Recreate is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_platform_statistics function
CREATE OR REPLACE FUNCTION public.get_platform_statistics()
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
  -- Require admin role
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- First day of current month
  first_day_of_month := DATE_TRUNC('month', CURRENT_DATE);

  -- Totals
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO new_users_this_month FROM public.profiles WHERE created_at >= first_day_of_month;
  SELECT COUNT(*) INTO active_subscriptions FROM public.user_subscriptions WHERE status = 'active';

  -- Simplified revenue: sum of monthly price for active subscriptions
  SELECT COALESCE(SUM(s.price_monthly), 0) INTO total_revenue
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON us.subscription_id = s.id
  WHERE us.status = 'active';

  SELECT COUNT(*) INTO total_companies FROM public.companies;
  SELECT COUNT(*) INTO active_jobs FROM public.jobs WHERE status = 'interviewing';
  SELECT COUNT(*) INTO completed_interviews FROM public.interviews WHERE status = 'completed';
  SELECT COUNT(*) INTO total_candidates FROM public.candidates;

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

-- Grants
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_statistics() TO authenticated;

-- Ensure 'signed-contracts' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
SELECT 'signed-contracts', 'signed-contracts', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'signed-contracts'
);

UPDATE storage.buckets
SET public = true
WHERE id = 'signed-contracts'; 