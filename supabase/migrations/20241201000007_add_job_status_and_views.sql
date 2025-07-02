-- Migration: Add job status enum and comprehensive views
-- This migration adds job status tracking and creates views for dashboard analytics

-- Create job status enum
CREATE TYPE job_status AS ENUM ('draft', 'interviewing', 'closed');

-- Add status column to jobs table with default value 'draft'
ALTER TABLE public.jobs 
ADD COLUMN status job_status DEFAULT 'draft' NOT NULL;

-- Create index for job status for better query performance
CREATE INDEX idx_jobs_status ON public.jobs(status);

-- Create comprehensive company stats view for dashboard analytics
CREATE OR REPLACE VIEW public.company_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Job statistics
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.is_active = true THEN j.id END) as active_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'draft' THEN j.id END) as draft_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'interviewing' THEN j.id END) as interviewing_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'closed' THEN j.id END) as closed_jobs,
    
    -- User statistics
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT CASE WHEN us.status = 'active' THEN p.id END) as active_users,
    
    -- Candidate statistics
    COUNT(DISTINCT ca.id) as total_candidates,
    COUNT(DISTINCT CASE WHEN ca.submitted_at IS NOT NULL THEN ca.id END) as completed_interviews,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= date_trunc('month', NOW()) THEN ca.id END) as candidates_this_month,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= date_trunc('week', NOW()) THEN ca.id END) as candidates_this_week,
    
    -- Response and evaluation statistics
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT e.id) as total_evaluations,
    
    -- Subscription statistics
    COUNT(DISTINCT CASE WHEN s.name = 'free' THEN us.id END) as free_users,
    COUNT(DISTINCT CASE WHEN s.name = 'pro' THEN us.id END) as pro_users,
    COUNT(DISTINCT CASE WHEN s.name = 'business' THEN us.id END) as business_users,
    COUNT(DISTINCT CASE WHEN s.name = 'enterprise' THEN us.id END) as enterprise_users,
    
    -- Activity metrics
    MAX(j.created_at) as last_job_created,
    MAX(ca.created_at) as last_candidate_created,
    MAX(r.created_at) as last_response_created

FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
LEFT JOIN public.jobs j ON p.id = j.profile_id
LEFT JOIN public.candidates ca ON j.id = ca.job_id
LEFT JOIN public.responses r ON ca.id = r.candidate_id
LEFT JOIN public.evaluations e ON ca.id = e.candidate_id
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id
GROUP BY c.id, c.name, c.slug, c.created_at;

-- Create comprehensive jobs view with related data
CREATE OR REPLACE VIEW public.jobs_detailed AS
SELECT 
    j.id,
    j.profile_id,
    j.title,
    j.fields,
    j.interview_format,
    j.interview_token,
    j.is_active,
    j.status,
    j.created_at,
    j.updated_at,
    
    -- Profile information
    p.email as creator_email,
    p.first_name as creator_first_name,
    p.last_name as creator_last_name,
    
    -- Company information
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    
    -- Subscription information
    s.name as subscription_plan,
    s.max_jobs,
    s.max_interviews_per_month,
    
    -- Candidate statistics
    COUNT(DISTINCT ca.id) as total_candidates,
    COUNT(DISTINCT CASE WHEN ca.submitted_at IS NOT NULL THEN ca.id END) as completed_interviews,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= date_trunc('month', NOW()) THEN ca.id END) as interviews_this_month,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= date_trunc('week', NOW()) THEN ca.id END) as interviews_this_week,
    COUNT(DISTINCT CASE WHEN ca.submitted_at >= CURRENT_DATE THEN ca.id END) as interviews_today,
    
    -- Response and evaluation statistics
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT e.id) as total_evaluations,
    ROUND(AVG(e.score), 2) as average_score,
    
    -- Activity timestamps
    MAX(ca.created_at) as last_candidate_created,
    MAX(ca.submitted_at) as last_interview_completed,
    
    -- Interview link
    CONCAT(
        COALESCE(current_setting('app.base_url', true), 'http://localhost:3000'),
        '/interview/',
        j.interview_token
    ) as interview_link

FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id
LEFT JOIN public.candidates ca ON j.id = ca.job_id
LEFT JOIN public.responses r ON ca.id = r.candidate_id
LEFT JOIN public.evaluations e ON ca.id = e.candidate_id
GROUP BY 
    j.id, j.profile_id, j.title, j.fields, j.interview_format, 
    j.interview_token, j.is_active, j.status, j.created_at, j.updated_at,
    p.email, p.first_name, p.last_name,
    c.id, c.name, c.slug,
    s.name, s.max_jobs, s.max_interviews_per_month;

-- Create user-specific jobs view for easier filtering
CREATE OR REPLACE VIEW public.user_jobs AS
SELECT 
    jd.*,
    
    -- User usage tracking
    (
        SELECT COUNT(*) 
        FROM public.jobs j2 
        WHERE j2.profile_id = jd.profile_id AND j2.is_active = true
    ) as user_active_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.candidates ca2
        JOIN public.jobs j2 ON ca2.job_id = j2.id
        WHERE j2.profile_id = jd.profile_id 
        AND ca2.submitted_at >= date_trunc('month', NOW())
    ) as user_interviews_this_month

FROM public.jobs_detailed jd;

-- Create company-specific jobs view
CREATE OR REPLACE VIEW public.company_jobs AS
SELECT 
    jd.*,
    
    -- Company-wide statistics
    cs.total_jobs as company_total_jobs,
    cs.active_jobs as company_active_jobs,
    cs.total_candidates as company_total_candidates,
    cs.candidates_this_month as company_candidates_this_month

FROM public.jobs_detailed jd
LEFT JOIN public.company_stats cs ON jd.company_id = cs.company_id;

-- Drop the existing user_details view first to avoid column conflicts
DROP VIEW IF EXISTS public.user_details;

-- Recreate the user_details view with enhanced job status information
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at as user_created_at,
    p.updated_at as user_updated_at,
    
    -- Company details
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Subscription details
    s.id as subscription_id,
    s.name as subscription_name,
    s.description as subscription_description,
    s.price_monthly,
    s.price_yearly,
    s.max_jobs,
    s.max_interviews_per_month,
    s.features as subscription_features,
    
    -- User subscription status
    us.status as subscription_status,
    us.started_at as subscription_started_at,
    us.expires_at as subscription_expires_at,
    
    -- Enhanced usage counts with status breakdown
    (
        SELECT COUNT(*) 
        FROM public.jobs j 
        WHERE j.profile_id = p.id AND j.is_active = true
    ) as active_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.jobs j 
        WHERE j.profile_id = p.id AND j.status = 'draft'
    ) as draft_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.jobs j 
        WHERE j.profile_id = p.id AND j.status = 'interviewing'
    ) as interviewing_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.jobs j 
        WHERE j.profile_id = p.id AND j.status = 'closed'
    ) as closed_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        WHERE j.profile_id = p.id 
        AND ca.submitted_at >= date_trunc('month', NOW())
    ) as interviews_this_month

FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id;

-- Create indexes for the new views and status column
CREATE INDEX idx_jobs_status_active ON public.jobs(status, is_active);
CREATE INDEX idx_jobs_profile_status ON public.jobs(profile_id, status);
CREATE INDEX idx_jobs_company_status ON public.jobs(profile_id, status) 
    WHERE status IN ('interviewing', 'closed');

-- Setup security invokers on all Views
ALTER VIEW public.company_stats SET (security_invoker = on);
ALTER VIEW public.jobs_detailed SET (security_invoker = on);
ALTER VIEW public.user_jobs SET (security_invoker = on);
ALTER VIEW public.company_jobs SET (security_invoker = on);
ALTER VIEW public.user_details SET (security_invoker = on);

-- Grant permissions to authenticated users
GRANT SELECT ON public.company_stats TO authenticated;
GRANT SELECT ON public.jobs_detailed TO authenticated;
GRANT SELECT ON public.user_jobs TO authenticated;
GRANT SELECT ON public.company_jobs TO authenticated;
GRANT SELECT ON public.user_details TO authenticated;

-- Comments for documentation
COMMENT ON TYPE job_status IS 'Enum for job status: draft, interviewing, closed';
COMMENT ON COLUMN public.jobs.status IS 'Current status of the job posting';
COMMENT ON VIEW public.company_stats IS 'Comprehensive company statistics for dashboard analytics';
COMMENT ON VIEW public.jobs_detailed IS 'Detailed view of jobs with candidate and performance metrics';
COMMENT ON VIEW public.user_jobs IS 'User-specific jobs view with usage tracking';
COMMENT ON VIEW public.company_jobs IS 'Company-specific jobs view with company-wide statistics';
COMMENT ON VIEW public.user_details IS 'Enhanced user view with job status breakdown and usage tracking';

-- Update jobs to interviewing status when they have candidates
-- This is a one-time update for existing data
UPDATE public.jobs 
SET status = 'interviewing' 
WHERE status = 'draft' 
AND id IN (
    SELECT DISTINCT job_id 
    FROM public.candidates 
    WHERE submitted_at IS NOT NULL
);
