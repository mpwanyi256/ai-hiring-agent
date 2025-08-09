-- Migration: Fix get_job_candidate_stats to use legacy status buckets from candidate_details.status
-- This avoids comparing enum candidate_status to text values like 'completed'

CREATE OR REPLACE FUNCTION public.get_job_candidate_stats(
  p_job_id uuid,
  p_profile_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  total_candidates bigint,
  completed_candidates bigint,
  in_progress_candidates bigint,
  pending_candidates bigint,
  average_score numeric
) AS $$
  SELECT 
    COUNT(*) as total_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'completed') as completed_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'in_progress') as in_progress_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'pending') as pending_candidates,
    ROUND(AVG(cd.score), 0) as average_score
  FROM public.candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id);
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_job_candidate_stats(uuid, uuid) IS 'Returns candidate counts by legacy status (completed/in_progress/pending) and average score for a job.'; 