-- Final API Completeness Check Migration
-- This migration ensures all required views and functions exist for complete API functionality

-- ============================================================================
-- PART 1: Drop and recreate company_stats view with correct columns
-- ============================================================================

-- Drop existing company_stats view first
DROP VIEW IF EXISTS company_stats;

-- Create company_stats view with correct column structure
CREATE VIEW company_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Job statistics
    COALESCE(job_stats.total_jobs, 0) as total_jobs,
    COALESCE(job_stats.active_jobs, 0) as active_jobs,
    COALESCE(job_stats.draft_jobs, 0) as draft_jobs,
    COALESCE(job_stats.closed_jobs, 0) as closed_jobs,
    
    -- Candidate statistics
    COALESCE(candidate_stats.total_candidates, 0) as total_candidates,
    COALESCE(candidate_stats.pending_candidates, 0) as pending_candidates,
    COALESCE(candidate_stats.in_progress_candidates, 0) as in_progress_candidates,
    COALESCE(candidate_stats.completed_candidates, 0) as completed_candidates,
    
    -- Interview statistics
    COALESCE(interview_stats.total_interviews, 0) as total_interviews,
    COALESCE(interview_stats.scheduled_interviews, 0) as scheduled_interviews,
    COALESCE(interview_stats.completed_interviews, 0) as completed_interviews,
    COALESCE(interview_stats.upcoming_interviews, 0) as upcoming_interviews,
    
    -- Team statistics
    COALESCE(team_stats.total_members, 0) as total_members,
    COALESCE(team_stats.active_members, 0) as active_members,
    
    -- Subscription information
    us.status as subscription_status,
    s.name as subscription_name,
    s.max_jobs as subscription_max_jobs,
    s.max_interviews_per_month as subscription_max_interviews,
    CASE 
        WHEN us.trial_end > NOW() THEN true 
        ELSE false 
    END as is_trial,
    us.trial_end,
    us.current_period_end

FROM companies c
LEFT JOIN (
    SELECT 
        p.company_id,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN j.status = 'published' THEN 1 END) as active_jobs,
        COUNT(CASE WHEN j.status = 'draft' THEN 1 END) as draft_jobs,
        COUNT(CASE WHEN j.status = 'closed' THEN 1 END) as closed_jobs
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    GROUP BY p.company_id
) job_stats ON c.id = job_stats.company_id
LEFT JOIN (
    SELECT 
        comp.id as company_id,
        COUNT(cand.id) as total_candidates,
        COUNT(CASE WHEN cand.candidate_status = 'pending' THEN 1 END) as pending_candidates,
        COUNT(CASE WHEN cand.candidate_status = 'in_progress' THEN 1 END) as in_progress_candidates,
        COUNT(CASE WHEN cand.candidate_status = 'completed' THEN 1 END) as completed_candidates
    FROM companies comp
    JOIN profiles p ON comp.id = p.company_id
    JOIN jobs j ON p.id = j.profile_id
    JOIN candidates cand ON j.id = cand.job_id
    GROUP BY comp.id
) candidate_stats ON c.id = candidate_stats.company_id
LEFT JOIN (
    SELECT 
        comp.id as company_id,
        COUNT(i.id) as total_interviews,
        COUNT(CASE WHEN i.status = 'scheduled' THEN 1 END) as scheduled_interviews,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_interviews,
        COUNT(CASE WHEN i.status = 'scheduled' AND i.date >= CURRENT_DATE THEN 1 END) as upcoming_interviews
    FROM companies comp
    JOIN profiles p ON comp.id = p.company_id
    JOIN jobs j ON p.id = j.profile_id
    JOIN interviews i ON j.id = i.job_id
    GROUP BY comp.id
) interview_stats ON c.id = interview_stats.company_id
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as total_members,
        COUNT(CASE WHEN role != 'inactive' THEN 1 END) as active_members
    FROM profiles
    WHERE company_id IS NOT NULL
    GROUP BY company_id
) team_stats ON c.id = team_stats.company_id
LEFT JOIN user_subscriptions us ON c.id = (
    SELECT p.company_id 
    FROM profiles p 
    WHERE p.id = us.profile_id 
    LIMIT 1
) AND us.status IN ('active', 'trialing')
LEFT JOIN subscriptions s ON us.subscription_id = s.id;

-- ============================================================================
-- PART 2: Create function to safely get dashboard metrics
-- ============================================================================

-- Create a security definer function for dashboard metrics to avoid RLS issues
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Get comprehensive dashboard metrics
  SELECT jsonb_build_object(
    'candidates', jsonb_build_object(
      'total', COALESCE(cs.total_candidates, 0),
      'thisWeek', COALESCE((
        SELECT COUNT(*)
        FROM candidates c
        JOIN jobs j ON c.job_id = j.id
        JOIN profiles p ON j.profile_id = p.id
        WHERE p.company_id = p_company_id
        AND c.created_at >= NOW() - INTERVAL '7 days'
      ), 0),
      'trend', jsonb_build_object(
        'value', COALESCE((
          SELECT COUNT(*)
          FROM candidates c
          JOIN jobs j ON c.job_id = j.id
          JOIN profiles p ON j.profile_id = p.id
          WHERE p.company_id = p_company_id
          AND c.created_at >= NOW() - INTERVAL '7 days'
        ), 0),
        'isPositive', true,
        'label', 'this week'
      )
    ),
    'interviews', jsonb_build_object(
      'total', COALESCE(cs.total_interviews, 0),
      'upcoming', COALESCE(cs.upcoming_interviews, 0),
      'scheduled', COALESCE(cs.scheduled_interviews, 0),
      'completed', COALESCE(cs.completed_interviews, 0)
    ),
    'jobs', jsonb_build_object(
      'total', COALESCE(cs.total_jobs, 0),
      'active', COALESCE(cs.active_jobs, 0),
      'draft', COALESCE(cs.draft_jobs, 0)
    ),
    'team', jsonb_build_object(
      'total', COALESCE(cs.total_members, 0),
      'active', COALESCE(cs.active_members, 0)
    )
  ) INTO result
  FROM company_stats cs
  WHERE cs.company_id = p_company_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Create function to get upcoming interviews safely
-- ============================================================================

-- Create a security definer function for upcoming interviews
CREATE OR REPLACE FUNCTION get_upcoming_interviews(
    p_company_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    interview_id UUID,
    interview_date DATE,
    interview_time TIME,
    interview_status TEXT,
    interview_title TEXT,
    job_title TEXT,
    candidate_name TEXT,
    candidate_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cui.interview_id,
        cui.interview_date,
        cui.interview_time,
        cui.interview_status,
        cui.interview_title,
        cui.job_title,
        cui.candidate_full_name,
        cui.candidate_email
    FROM company_upcoming_interviews cui
    WHERE cui.company_id::uuid = p_company_id
    ORDER BY cui.interview_date ASC, cui.interview_time ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Set permissions and security
-- ============================================================================

-- Set security invoker for company_stats view
ALTER VIEW company_stats SET (security_invoker = on);

-- Grant permissions
GRANT SELECT ON company_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_interviews(UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 5: Add helpful comments
-- ============================================================================

COMMENT ON VIEW company_stats IS 
'Comprehensive company statistics for dashboard analytics';

COMMENT ON FUNCTION get_dashboard_metrics(UUID) IS 
'Security definer function to get dashboard metrics without RLS issues';

COMMENT ON FUNCTION get_upcoming_interviews(UUID, INTEGER, INTEGER) IS 
'Security definer function to get upcoming interviews for a company'; 