-- Migration: Update candidate_details scores
-- - Prefer AI overall_score for score
-- - Use candidate_resumes.resume_score for resume_score

-- Drop and recreate view
DROP VIEW IF EXISTS public.candidate_details CASCADE;

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
  c.status::text as candidate_status,
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  (
    SELECT COUNT(*) 
    FROM responses r 
    WHERE r.candidate_id = c.id
  ) as response_count,
  COALESCE(e.id, ae.id) as evaluation_id,
  -- Prefer AI overall_score for score
  COALESCE(ae.overall_score, e.score) as score,
  COALESCE(e.recommendation, ae.recommendation) as recommendation,
  COALESCE(e.summary, ae.evaluation_summary) as summary,
  COALESCE(e.strengths, ae.key_strengths) as strengths,
  COALESCE(e.red_flags, ae.red_flags) as red_flags,
  COALESCE(e.skills_assessment, ae.category_scores) as skills_assessment,
  e.traits_assessment,
  COALESCE(e.created_at, ae.created_at) as evaluation_created_at,
  -- Use resume score strictly from candidate_resumes
  cr.resume_score as resume_score,
  e.resume_summary,
  COALESCE(e.evaluation_type, 'ai') as evaluation_type,
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
  (
    SELECT row_to_json(i) FROM (
      SELECT 
        iv.id,
        iv.date,
        iv.time,
        iv.timezone_id,
        iv.duration,
        iv.calendar_event_id,
        iv.meet_link,
        iv.status,
        iv.notes,
        iv.created_at,
        iv.updated_at
      FROM interviews iv
      WHERE iv.application_id = c.id
      ORDER BY iv.created_at ASC
      LIMIT 1
    ) i
  ) AS interview_details
FROM candidates c
INNER JOIN jobs j ON c.job_id = j.id
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN LATERAL (
  SELECT e2.*
  FROM evaluations e2
  WHERE e2.candidate_id = c.id
  ORDER BY e2.created_at DESC
  LIMIT 1
) e ON TRUE
LEFT JOIN LATERAL (
  SELECT ae2.*
  FROM ai_evaluations ae2
  WHERE ae2.candidate_id = c.id
  ORDER BY ae2.created_at DESC
  LIMIT 1
) ae ON TRUE
LEFT JOIN LATERAL (
  SELECT cr2.*
  FROM candidate_resumes cr2
  WHERE cr2.candidate_id = c.id AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

ALTER VIEW public.candidate_details SET (security_invoker = on);
GRANT SELECT ON public.candidate_details TO authenticated;
GRANT SELECT ON public.candidate_details TO anon;

-- Verification
DO $$
DECLARE v_exists boolean; BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema='public' AND table_name='candidate_details'
  ) INTO v_exists;
  RAISE NOTICE '✅ candidate_details recreated: %', v_exists;
END $$; 