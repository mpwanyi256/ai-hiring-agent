-- 00151_add_job_member_ids_to_jobs_comprehensive.sql
-- Add job member IDs (from job_permissions) to jobs_comprehensive view

SET search_path = public;

-- Recreate jobs_comprehensive view to include member_ids
DROP VIEW IF EXISTS public.jobs_comprehensive CASCADE;

CREATE OR REPLACE VIEW public.jobs_comprehensive AS
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
  j.interview_format,
  j.interview_token,
  j.is_active,
  j.created_at,
  j.updated_at,
  j.department_id,
  j.job_title_id,
  j.employment_type_id,
  j.workplace_type,
  j.job_type,
  j.salary_min,
  j.salary_max,
  j.salary_currency,
  j.salary_period,
  jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'firstName', p.first_name,
    'lastName', p.last_name,
    'role', p.role,
    'avatarUrl', p.avatar_url
  ) as creator_details,
  p.company_id,
  c.name as company_name,
  c.slug as company_slug,
  c.logo_url as company_logo_url,
  c.website as company_website,
  c.industry as company_industry,
  c.size_range as company_size,
  d.name as department_name,
  jt.name as job_title_name,
  et.name as employment_type_name,
  COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
  COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews,
  COALESCE(candidate_stats.response_count, 0) as response_count,
  COALESCE(candidate_stats.evaluation_count, 0) as evaluation_count,
  COALESCE(candidate_stats.average_score, 0) as average_score,
  -- New: list of members (users) who have explicit permissions on the job
  COALESCE(jp_members.member_ids, ARRAY[]::uuid[]) AS member_ids
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.departments d ON j.department_id = d.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
LEFT JOIN (
  SELECT 
    cand.job_id,
    COUNT(DISTINCT cand.id) as candidate_count,
    COUNT(DISTINCT CASE WHEN cand.is_completed = true THEN cand.id END) as completed_interviews,
    COUNT(DISTINCT r.id) as response_count,
    COUNT(DISTINCT e.id) as evaluation_count,
    ROUND(AVG(CASE WHEN e.score > 0 THEN e.score END), 2) as average_score
  FROM public.candidates cand
  LEFT JOIN public.responses r ON cand.id = r.candidate_id
  LEFT JOIN public.evaluations e ON cand.id = e.candidate_id AND cand.job_id = e.job_id
  GROUP BY cand.job_id
) candidate_stats ON j.id = candidate_stats.job_id
LEFT JOIN (
  SELECT 
    jp.job_id,
    array_agg(DISTINCT jp.user_id) AS member_ids
  FROM public.job_permissions jp
  GROUP BY jp.job_id
) jp_members ON j.id = jp_members.job_id;

ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.jobs_comprehensive TO authenticator, authenticated, anon, service_role;

COMMENT ON VIEW public.jobs_comprehensive IS 'Comprehensive jobs view with all job fields, creator and company details, statistics, and job member IDs from job_permissions';
COMMENT ON COLUMN public.jobs_comprehensive.member_ids IS 'UUID array of users who have explicit access to the job via job_permissions';


