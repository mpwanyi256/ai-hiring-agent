-- Recreate the user_details view that was accidentally dropped

-- Ensure we have the public schema
CREATE SCHEMA IF NOT EXISTS public;

-- Drop the view if it exists to recreate it cleanly
DROP VIEW IF EXISTS public.user_details;

-- Recreate the user_details view with enhanced job status information
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.company_id,
    p.created_at as user_created_at,
    p.updated_at as user_updated_at,
    
    -- Company information
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Subscription information
    s.id as subscription_id,
    s.name as subscription_name,
    s.max_jobs,
    s.max_interviews_per_month,
    us.status as subscription_status,
    us.created_at as subscription_created_at,
    
    -- Usage counts with enhanced job status breakdown
    COALESCE(job_counts.total_jobs, 0) as total_jobs,
    COALESCE(job_counts.active_jobs_count, 0) as active_jobs_count,
    COALESCE(job_counts.draft_jobs, 0) as draft_jobs,
    COALESCE(job_counts.interviewing_jobs, 0) as interviewing_jobs,
    COALESCE(job_counts.closed_jobs, 0) as closed_jobs,
    COALESCE(interview_counts.interviews_this_month, 0) as interviews_this_month,
    COALESCE(interview_counts.total_interviews, 0) as total_interviews
    
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id
LEFT JOIN (
    SELECT 
        profile_id,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_jobs,
        COUNT(CASE WHEN status = 'interviewing' THEN 1 END) as interviewing_jobs,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_jobs
    FROM public.jobs 
    GROUP BY profile_id
) job_counts ON p.id = job_counts.profile_id
LEFT JOIN (
    SELECT 
        j.profile_id,
        COUNT(CASE WHEN r.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as interviews_this_month,
        COUNT(DISTINCT r.profile_id) as total_interviews
    FROM public.jobs j
    LEFT JOIN public.responses r ON j.id = r.job_id AND r.profile_id IS NOT NULL
    GROUP BY j.profile_id
) interview_counts ON p.id = interview_counts.profile_id;

-- Set security invoker to ensure RLS policies are applied correctly
ALTER VIEW public.user_details SET (security_invoker = on);

-- Grant appropriate permissions
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role;

-- Add helpful comment
COMMENT ON VIEW public.user_details IS 'Enhanced user view with job status breakdown and usage tracking - recreated after accidental drop'; 