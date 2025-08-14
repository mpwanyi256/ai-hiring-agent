-- 00152_fix_get_company_completed_interviews.sql
-- Fix function to reference interviews.application_id instead of non-existent interviews.candidate_id

SET search_path = public;

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
  JOIN public.candidates c ON c.id = i.application_id
  JOIN public.jobs j ON j.id = c.job_id
  JOIN public.profiles p ON p.id = j.profile_id
  WHERE p.company_id = p_company_id
    AND i.status = 'completed'
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_company_completed_interviews(UUID, INT) TO authenticated;


