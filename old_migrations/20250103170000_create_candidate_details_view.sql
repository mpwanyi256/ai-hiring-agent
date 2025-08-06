-- Create comprehensive candidate details view and function
-- This migration creates optimized views and functions for fetching candidate data for job details pages

-- Create a comprehensive candidate details view
CREATE OR REPLACE VIEW candidate_details AS
SELECT 
  c.id,
  c.job_id,
  c.interview_token,
  c.email,
  c.first_name,
  c.last_name,
  COALESCE(NULLIF(TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')), ''), 'Anonymous') as full_name,
  c.current_step,
  c.total_steps,
  c.is_completed,
  c.submitted_at,
  c.created_at,
  c.updated_at,
  
  -- Calculate progress percentage
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  
  -- Job information
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  
  -- Response count
  COALESCE(response_counts.response_count, 0) as response_count,
  
  -- Evaluation data
  e.id as evaluation_id,
  e.score,
  e.recommendation,
  e.summary,
  e.strengths,
  e.red_flags,
  e.skills_assessment,
  e.traits_assessment,
  e.created_at as evaluation_created_at,
  
  -- Status derived from completion and evaluation
  CASE 
    WHEN c.is_completed AND e.id IS NOT NULL THEN 'completed'
    WHEN c.is_completed AND e.id IS NULL THEN 'completed'
    WHEN NOT c.is_completed AND c.current_step > 1 THEN 'in_progress'
    ELSE 'pending'
  END as status

FROM candidates c
INNER JOIN jobs j ON c.job_id = j.id
LEFT JOIN evaluations e ON c.id = e.candidate_id
LEFT JOIN (
  SELECT 
    candidate_id, 
    COUNT(*) as response_count
  FROM responses 
  GROUP BY candidate_id
) response_counts ON c.id = response_counts.candidate_id;

-- Create function to get candidate details for a specific job (simplified)
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

-- Create function to get candidate statistics for a job
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

-- Create function to get detailed candidate responses
CREATE OR REPLACE FUNCTION get_candidate_responses(
  p_candidate_id UUID,
  p_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  response_text TEXT,
  response_time INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify access: candidate must belong to a job owned by the profile
  IF p_profile_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM candidates c
      INNER JOIN jobs j ON c.job_id = j.id
      WHERE c.id = p_candidate_id AND j.profile_id = p_profile_id
    ) THEN
      RAISE EXCEPTION 'Access denied: candidate not found or not owned by profile';
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.question_text,
    r.response_text,
    r.response_time,
    r.created_at
  FROM responses r
  WHERE r.candidate_id = p_candidate_id
  ORDER BY r.created_at ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_responses(UUID, UUID) TO authenticated;

-- Grant select on the view to authenticated users
GRANT SELECT ON candidate_details TO authenticated;

-- Add helpful comments
COMMENT ON VIEW candidate_details IS 'Comprehensive view of candidates with job and evaluation data for efficient querying';
COMMENT ON FUNCTION get_job_candidate_details IS 'Get paginated candidate details for a specific job with optional filtering';
COMMENT ON FUNCTION get_job_candidate_stats IS 'Get statistical summary of candidates for a job';
COMMENT ON FUNCTION get_candidate_responses IS 'Get detailed responses for a specific candidate with access control';

-- Create indexes for better performance (fixed - removed subquery from WHERE clause)
CREATE INDEX IF NOT EXISTS idx_candidates_job_profile ON candidates(job_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_score ON evaluations(candidate_id, score) 
  WHERE score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_responses_candidate_created ON responses(candidate_id, created_at); 