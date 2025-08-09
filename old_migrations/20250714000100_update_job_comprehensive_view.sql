-- Create comprehensive jobs view
CREATE OR REPLACE VIEW public.jobs_comprehensive AS
SELECT 
    -- Job fields
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
    
    -- Creator details as JSON object
    jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'role', p.role,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) as creator_details,
    
    -- Company details
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    
    -- Candidate count
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
    COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews,
    
    -- Response and evaluation counts
    COALESCE(response_stats.response_count, 0) as response_count,
    COALESCE(evaluation_stats.evaluation_count, 0) as evaluation_count,
    COALESCE(evaluation_stats.average_score, 0) as average_score,

    -- Add new fields at the end
    j.department_id,
    j.job_title_id,
    j.employment_type_id,
    j.workplace_type,
    j.job_type

FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count,
        COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as completed_interviews
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id
LEFT JOIN (
    SELECT 
        ca.job_id,
        COUNT(r.id) as response_count
    FROM public.candidates ca
    LEFT JOIN public.responses r ON ca.id = r.candidate_id
    GROUP BY ca.job_id
) response_stats ON j.id = response_stats.job_id
LEFT JOIN (
    SELECT 
        ca.job_id,
        COUNT(e.id) as evaluation_count,
        ROUND(AVG(e.score), 2) as average_score
    FROM public.candidates ca
    LEFT JOIN public.evaluations e ON ca.id = e.candidate_id
    GROUP BY ca.job_id
) evaluation_stats ON j.id = evaluation_stats.job_id;

-- Create indexes for better performance on the view
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_profile_id ON public.jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_created_at ON public.jobs(created_at DESC);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_job_title_id ON public.jobs(job_title_id);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_employment_type_id ON public.jobs(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_workplace_type ON public.jobs(workplace_type);
CREATE INDEX IF NOT EXISTS idx_jobs_comprehensive_job_type ON public.jobs(job_type);

-- Grant permissions for the view
GRANT SELECT ON public.jobs_comprehensive TO authenticated;
GRANT SELECT ON public.jobs_comprehensive TO service_role;

-- Add comments for documentation
COMMENT ON VIEW public.jobs_comprehensive IS 'Comprehensive jobs view with all job fields, creator details as JSON object, and company details';
COMMENT ON COLUMN public.jobs_comprehensive.creator_details IS 'JSON object containing creator profile information';
COMMENT ON COLUMN public.jobs_comprehensive.candidate_count IS 'Total number of candidates for this job';
COMMENT ON COLUMN public.jobs_comprehensive.completed_interviews IS 'Number of completed interviews for this job';
COMMENT ON COLUMN public.jobs_comprehensive.response_count IS 'Total number of responses for this job';
COMMENT ON COLUMN public.jobs_comprehensive.evaluation_count IS 'Total number of evaluations for this job';
COMMENT ON COLUMN public.jobs_comprehensive.average_score IS 'Average evaluation score for this job'; 

-- Add RLS
ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.jobs_comprehensive TO authenticated;
