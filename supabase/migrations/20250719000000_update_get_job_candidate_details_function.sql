-- Update get_job_candidate_details function to remove profile filtering and only return completed candidates
-- This migration removes the p_profile_id parameter and adds a filter to only return candidates where is_completed = true

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);

-- Recreate the function without p_profile_id parameter and with is_completed filter
CREATE OR REPLACE FUNCTION get_job_candidate_details(
  p_job_id UUID,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF candidate_details
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND cd.is_completed = true  -- Only return completed candidates
    AND (
      p_search IS NULL OR 
      cd.full_name ILIKE '%' || p_search || '%' OR 
      cd.email ILIKE '%' || p_search || '%' OR
      cd.resume_filename ILIKE '%' || p_search || '%'
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

-- Update the function comment
COMMENT ON FUNCTION get_job_candidate_details(UUID, TEXT, TEXT, INTEGER, INTEGER) IS 'Get paginated candidate details for a specific job with optional filtering. Only returns candidates where is_completed = true. No longer filters by profile_id to allow company-wide access.';

-- Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated; 