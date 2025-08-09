-- Fix candidate database functions to resolve structure mismatch errors
-- This migration updates the functions to use simpler return types

-- Drop and recreate the candidate details function with simplified return type
DROP FUNCTION IF EXISTS get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_job_candidate_details(
  p_job_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF candidate_details
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id)
    AND (
      p_search IS NULL OR 
      cd.full_name ILIKE '%' || p_search || '%' OR 
      cd.email ILIKE '%' || p_search || '%'
    )
    AND (
      p_status IS NULL OR 
      p_status = 'all' OR
      cd.status = p_status
    )
  ORDER BY cd.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Drop and recreate the candidate stats function with simplified implementation
DROP FUNCTION IF EXISTS get_job_candidate_stats(UUID, UUID);

CREATE OR REPLACE FUNCTION get_job_candidate_stats(
  p_job_id UUID,
  p_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_candidates BIGINT,
  completed_candidates BIGINT,
  in_progress_candidates BIGINT,
  pending_candidates BIGINT,
  average_score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'completed') as completed_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'in_progress') as in_progress_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'pending') as pending_candidates,
    ROUND(AVG(cd.score), 0) as average_score
  FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id);
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(UUID, UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_job_candidate_details IS 'Get paginated candidate details for a specific job with optional filtering (fixed structure)';
COMMENT ON FUNCTION get_job_candidate_stats IS 'Get statistical summary of candidates for a job (simplified implementation)'; 