-- Enhance User Details View for Auth API Migration
-- This migration enhances the user_details view with all fields required by the auth check API

-- ============================================================================
-- PART 1: Recreate user_details view with complete information
-- ============================================================================

-- Drop and recreate user_details view with all required fields for auth API
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
    p.created_at as user_created_at,  -- Added for auth API
    
    -- Company information
    c.name as company_name,
    c.slug as company_slug,
    c.bio as company_bio,
    c.logo_path as company_logo,
    
    -- Subscription information (with all required fields)
    us.id as subscription_id,  -- Added for auth API
    s.name as subscription_name,
    s.description as subscription_description,
    s.features as subscription_features,
    s.limits as subscription_limits,
    s.max_jobs,  -- Added for auth API
    s.max_interviews_per_month,  -- Added for auth API
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
    
    -- Enhanced job statistics (with proper counts for auth API)
    COALESCE(job_stats.total_jobs, 0) as total_jobs,
    COALESCE(job_stats.active_jobs, 0) as active_jobs,
    COALESCE(job_stats.active_jobs, 0) as active_jobs_count,  -- Added for auth API
    
    -- Interview statistics for current month (added for auth API)
    COALESCE(interview_stats.interviews_this_month, 0) as interviews_this_month

FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN user_subscriptions us ON p.id = us.profile_id AND us.status IN ('active', 'trialing')
LEFT JOIN subscriptions s ON us.subscription_id = s.id
LEFT JOIN (
    SELECT 
        profile_id,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as active_jobs
    FROM jobs
    GROUP BY profile_id
) job_stats ON p.id = job_stats.profile_id
LEFT JOIN (
    SELECT 
        j.profile_id,
        COUNT(i.id) as interviews_this_month
    FROM interviews i
    JOIN jobs j ON i.job_id = j.id
    WHERE EXTRACT(YEAR FROM i.created_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM i.created_at) = EXTRACT(MONTH FROM NOW())
    GROUP BY j.profile_id
) interview_stats ON p.id = interview_stats.profile_id;

-- ============================================================================
-- PART 2: Set security invoker and permissions
-- ============================================================================

-- Set security invoker for the view
ALTER VIEW user_details SET (security_invoker = on);

-- Grant permissions for authenticated users
GRANT SELECT ON user_details TO authenticated;

-- ============================================================================
-- PART 3: Add helpful comments
-- ============================================================================

COMMENT ON VIEW user_details IS 
'Complete user profile information with company, subscription details, and usage statistics for auth API'; 