-- Migration: Rename candidates.candidate_status to status and rebuild dependent views

-- Drop dependent views first
DROP VIEW IF EXISTS public.candidate_details;
DROP VIEW IF EXISTS public.company_candidate_pipeline;

-- Rename column back to status (enum type remains public.candidate_status)
ALTER TABLE public.candidates RENAME COLUMN candidate_status TO status;

-- Ensure constraints and defaults
ALTER TABLE public.candidates 
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'under_review'::public.candidate_status;

-- Recreate index targeting the new column name
DROP INDEX IF EXISTS idx_candidates_status;
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);

-- Recreate candidate_details view (keeps legacy computed pipeline status and exposes enum as candidate_status)
CREATE OR REPLACE VIEW public.candidate_details AS
SELECT 
  c.id,
  c.candidate_info_id,
  c.job_id,
  c.interview_token,
  ci.email,
  ci.first_name,
  ci.last_name,
  COALESCE(NULLIF(TRIM(ci.first_name || ' ' || COALESCE(ci.last_name, '')), ''), 'Anonymous') as full_name,
  c.current_step,
  c.total_steps,
  c.is_completed,
  c.submitted_at,
  c.created_at,
  c.updated_at,
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  COALESCE(response_counts.response_count, 0) as response_count,
  e.id as evaluation_id,
  e.score,
  e.recommendation,
  e.summary,
  e.strengths,
  e.red_flags,
  e.skills_assessment,
  e.traits_assessment,
  e.created_at as evaluation_created_at,
  cr.id as resume_id,
  cr.original_filename as resume_filename,
  cr.file_path as resume_file_path,
  cr.public_url as resume_public_url,
  cr.file_size as resume_file_size,
  cr.file_type as resume_file_type,
  cr.word_count as resume_word_count,
  cr.parsing_status as resume_parsing_status,
  cr.parsing_error as resume_parsing_error,
  cr.created_at as resume_uploaded_at,
  e.resume_score,
  e.resume_summary,
  e.evaluation_type,
  CASE 
    WHEN c.is_completed AND e.id IS NOT NULL THEN 'completed'
    WHEN c.is_completed AND e.id IS NULL THEN 'completed'
    WHEN NOT c.is_completed AND c.current_step > 1 THEN 'in_progress'
    ELSE 'pending'
  END as status,
  c.status as candidate_status
FROM public.candidates c
INNER JOIN public.jobs j ON c.job_id = j.id
LEFT JOIN public.candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN public.evaluations e ON c.id = e.candidate_id AND e.job_id = c.job_id
LEFT JOIN (
  SELECT candidate_id, COUNT(*) as response_count
  FROM public.responses
  GROUP BY candidate_id
) response_counts ON c.id = response_counts.candidate_id
LEFT JOIN LATERAL (
  SELECT * FROM public.candidate_resumes cr2
  WHERE cr2.candidate_id = c.id AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

GRANT SELECT ON public.candidate_details TO authenticated;
GRANT SELECT ON public.candidate_details TO service_role;

-- Recreate company_candidate_pipeline view (uses enum status as the grouping key)
CREATE OR REPLACE VIEW public.company_candidate_pipeline AS
SELECT
  comp.id AS company_id,
  comp.name,
  c.status AS status,
  COUNT(c.id) AS count
FROM public.candidates c
JOIN public.jobs j ON c.job_id = j.id
JOIN public.profiles p ON j.profile_id = p.id
JOIN public.companies comp ON p.company_id = comp.id
WHERE j.status != 'closed'
GROUP BY comp.id, c.status;

ALTER VIEW public.company_candidate_pipeline SET (security_invoker = on);
GRANT SELECT ON public.company_candidate_pipeline TO authenticated; 