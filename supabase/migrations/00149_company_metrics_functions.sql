-- 00149_company_metrics_functions.sql
-- Company-wide metrics helper functions (SECURITY DEFINER)

SET search_path = public;

-- Total and since counts for candidates by company
CREATE OR REPLACE FUNCTION public.get_company_candidate_counts(
  p_company_id UUID,
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total BIGINT,
  since_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)
     FROM public.candidates c
     JOIN public.jobs j ON j.id = c.job_id
     JOIN public.profiles p ON p.id = j.profile_id
     WHERE p.company_id = p_company_id) AS total,
    (SELECT COUNT(*)
     FROM public.candidates c
     JOIN public.jobs j ON j.id = c.job_id
     JOIN public.profiles p ON p.id = j.profile_id
     WHERE p.company_id = p_company_id
       AND (p_since IS NULL OR c.created_at >= p_since)) AS since_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_company_candidate_counts(UUID, TIMESTAMPTZ) TO authenticated;

-- Recent completed interviews for a company (to compute response time client-side)
CREATE OR REPLACE FUNCTION public.get_company_completed_interviews(
  p_company_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  interview_date DATE,
  interview_time TIME,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.created_at, i.date AS interview_date, i.time AS interview_time, i.status
  FROM public.interviews i
  JOIN public.candidates c ON c.id = i.candidate_id
  JOIN public.jobs j ON j.id = c.job_id
  JOIN public.profiles p ON p.id = j.profile_id
  WHERE p.company_id = p_company_id
    AND i.status = 'completed'
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_company_completed_interviews(UUID, INT) TO authenticated; 