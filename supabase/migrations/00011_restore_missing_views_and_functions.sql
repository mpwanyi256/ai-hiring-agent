-- Restore Missing Views and Functions Migration
-- This migration restores missing views and functions for dashboard metrics and notifications

-- ============================================================================
-- PART 1: Create notifications_details view
-- ============================================================================

-- First, add missing columns to notifications table if they don't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_text TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);

-- Drop and recreate the notifications_details view
DROP VIEW IF EXISTS notifications_details;
CREATE VIEW notifications_details AS
SELECT 
  n.id::text AS id,
  n.type,
  n.title,
  n.message,
  n.created_at AS timestamp,
  CASE 
    WHEN n.type = 'success' THEN 'success'
    WHEN n.type = 'error' THEN 'error'
    WHEN n.type = 'warning' THEN 'warning'
    ELSE 'info'
  END AS status,
  n.is_read AS read,
  n.user_id,
  -- Get company_id from the user's profile
  p.company_id,
  COALESCE(n.metadata, '{}'::jsonb) as metadata,
  COALESCE(n.category, n.type) AS entity_type,
  COALESCE(n.related_entity_id::text, n.metadata->>'entity_id', '') AS entity_id,
  n.action_url,
  n.action_text,
  n.read_at,
  n.expires_at,
  n.id AS notification_id
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE n.expires_at IS NULL OR n.expires_at > NOW()
ORDER BY n.created_at DESC;

-- ============================================================================
-- PART 2: Create company_stats view for dashboard metrics
-- ============================================================================

-- Drop and recreate company stats view
DROP VIEW IF EXISTS company_stats;
CREATE VIEW company_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Job statistics (using status instead of is_active)
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'published' THEN j.id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'draft' THEN j.id END) as draft_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'published' THEN j.id END) as interviewing_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'closed' THEN j.id END) as closed_jobs,
    
    -- User statistics
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT CASE WHEN us.status IN ('active', 'trialing') THEN p.id END) as active_users,
    
    -- Candidate statistics
    COUNT(DISTINCT ca.id) as total_candidates,
    COUNT(DISTINCT CASE WHEN ca.submitted_at IS NOT NULL THEN ca.id END) as completed_interviews,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= date_trunc('month', NOW()) THEN ca.id END) as candidates_this_month,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= date_trunc('week', NOW()) THEN ca.id END) as candidates_this_week,
    
    -- Response and evaluation statistics
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT e.id) as total_evaluations,
    
    -- Subscription statistics (updated for new model without free tier)
    COUNT(DISTINCT CASE WHEN s.name = 'pro' THEN us.id END) as pro_users,
    COUNT(DISTINCT CASE WHEN s.name = 'business' THEN us.id END) as business_users,
    COUNT(DISTINCT CASE WHEN s.name = 'enterprise' THEN us.id END) as enterprise_users,
    COUNT(DISTINCT CASE WHEN us.id IS NULL THEN p.id END) as evaluation_users,
    
    -- Activity metrics
    MAX(j.created_at) as last_job_created,
    MAX(ca.created_at) as last_candidate_created,
    MAX(r.created_at) as last_response_created

FROM companies c
LEFT JOIN profiles p ON c.id = p.company_id
LEFT JOIN jobs j ON p.id = j.profile_id
LEFT JOIN candidates ca ON j.id = ca.job_id
LEFT JOIN responses r ON ca.id = r.candidate_id
LEFT JOIN evaluations e ON ca.id = e.candidate_id
LEFT JOIN user_subscriptions us ON p.id = us.profile_id AND us.status IN ('active', 'trialing')
LEFT JOIN subscriptions s ON us.subscription_id = s.id
GROUP BY c.id, c.name, c.slug, c.created_at;

-- ============================================================================
-- PART 3: Create jobs_detailed view
-- ============================================================================

-- Drop and recreate jobs detailed view
DROP VIEW IF EXISTS jobs_detailed;
CREATE VIEW jobs_detailed AS
SELECT 
    j.id,
    j.profile_id,
    j.title,
    j.description,
    j.requirements,
    j.location,
    j.salary_range,
    j.employment_type,
    j.status,
    j.fields,
    j.settings,
    j.company_name,
    j.created_at,
    j.updated_at,
    
    -- Profile information
    p.email as creator_email,
    p.first_name as creator_first_name,
    p.last_name as creator_last_name,
    p.company_id,
    
    -- Company information
    c.name as company_name_from_company,
    c.slug as company_slug,
    
    -- Candidate statistics
    COUNT(DISTINCT ca.id) as total_candidates,
    COUNT(DISTINCT CASE WHEN ca.submitted_at IS NOT NULL THEN ca.id END) as completed_candidates,
    COUNT(DISTINCT CASE WHEN ca.submitted_at IS NULL THEN ca.id END) as pending_candidates,
    
    -- Latest activity
    MAX(ca.created_at) as last_candidate_created,
    MAX(ca.submitted_at) as last_interview_completed

FROM jobs j
LEFT JOIN profiles p ON j.profile_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN candidates ca ON j.id = ca.job_id
GROUP BY j.id, j.profile_id, j.title, j.description, j.requirements, j.location, 
         j.salary_range, j.employment_type, j.status, j.fields, j.settings, 
         j.company_name, j.created_at, j.updated_at,
         p.email, p.first_name, p.last_name, p.company_id,
         c.name, c.slug;

-- ============================================================================
-- PART 4: Create user_jobs view
-- ============================================================================

-- Drop and recreate user jobs view
DROP VIEW IF EXISTS user_jobs;
CREATE VIEW user_jobs AS
SELECT 
    j.*,
    p.company_id,
    c.name as company_name_full,
    c.slug as company_slug
FROM jobs j
JOIN profiles p ON j.profile_id = p.id
JOIN companies c ON p.company_id = c.id;

-- ============================================================================
-- PART 5: Create company_jobs view
-- ============================================================================

-- Drop and recreate company jobs view
DROP VIEW IF EXISTS company_jobs;
CREATE VIEW company_jobs AS
SELECT 
    j.*,
    p.company_id,
    p.email as creator_email,
    p.first_name as creator_first_name,
    p.last_name as creator_last_name,
    c.name as company_name_full,
    c.slug as company_slug
FROM jobs j
JOIN profiles p ON j.profile_id = p.id
JOIN companies c ON p.company_id = c.id;

-- ============================================================================
-- PART 6: Create enhanced user_details view (ensure it's complete)
-- ============================================================================

-- Drop and recreate user_details view with comprehensive information
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
    
    -- Job statistics
    COALESCE(job_stats.total_jobs, 0) as total_jobs,
    COALESCE(job_stats.active_jobs, 0) as active_jobs

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
) job_stats ON p.id = job_stats.profile_id;

-- ============================================================================
-- PART 7: Set security invokers and permissions for all views
-- ============================================================================

-- Set security invokers for all views
ALTER VIEW notifications_details SET (security_invoker = on);
ALTER VIEW company_stats SET (security_invoker = on);
ALTER VIEW jobs_detailed SET (security_invoker = on);
ALTER VIEW user_jobs SET (security_invoker = on);
ALTER VIEW company_jobs SET (security_invoker = on);
ALTER VIEW user_details SET (security_invoker = on);

-- Grant permissions for authenticated users
GRANT SELECT ON notifications_details TO authenticated;
GRANT SELECT ON company_stats TO authenticated;
GRANT SELECT ON jobs_detailed TO authenticated;
GRANT SELECT ON user_jobs TO authenticated;
GRANT SELECT ON company_jobs TO authenticated;
GRANT SELECT ON user_details TO authenticated;

-- Grant permissions for anonymous users where appropriate
GRANT SELECT ON company_stats TO anon;
GRANT SELECT ON jobs_detailed TO anon;

-- ============================================================================
-- PART 8: Add helpful comments
-- ============================================================================

COMMENT ON VIEW notifications_details IS 
'Unified view of all notifications from the notifications table with proper formatting';

COMMENT ON VIEW company_stats IS 
'Comprehensive company statistics for dashboard analytics and metrics';

COMMENT ON VIEW jobs_detailed IS 
'Detailed job information with company and candidate statistics';

COMMENT ON VIEW user_jobs IS 
'User-specific jobs view for filtering jobs by authenticated user';

COMMENT ON VIEW company_jobs IS 
'Company-specific jobs view with creator information';

COMMENT ON VIEW user_details IS 
'Complete user profile information with company and subscription details'; 