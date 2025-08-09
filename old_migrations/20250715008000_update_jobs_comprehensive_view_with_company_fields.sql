-- Migration: Update jobs_comprehensive view to include new company fields
DROP VIEW IF EXISTS public.jobs_comprehensive;

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
    c.bio as company_bio,
    c.logo_url as company_logo_url,
    c.logo_path as company_logo_path,
    
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

-- Add comments for new columns
COMMENT ON COLUMN public.jobs_comprehensive.company_bio IS 'Short company description for public display';
COMMENT ON COLUMN public.jobs_comprehensive.company_logo_url IS 'URL to company logo image';
COMMENT ON COLUMN public.jobs_comprehensive.company_logo_path IS 'Path to company logo image in storage'; 