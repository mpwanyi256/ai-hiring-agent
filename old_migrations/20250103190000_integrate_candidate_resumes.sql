-- Integrate candidate resumes into candidate details view and functions
-- This migration updates the view and functions to include resume information

-- Drop dependent functions first to avoid dependency errors
DROP FUNCTION IF EXISTS get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_job_candidate_stats(UUID, UUID);

-- Drop and recreate the candidate_details view to include resume information
DROP VIEW IF EXISTS candidate_details;

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
  
  -- Resume information
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
  
  -- Resume evaluation data from evaluations table
  e.resume_score,
  e.resume_summary,
  e.evaluation_type,
  
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
) response_counts ON c.id = response_counts.candidate_id
LEFT JOIN candidate_resumes cr ON (
  c.job_id = cr.job_id AND 
  (c.id = cr.candidate_id OR c.email = cr.email)
);

-- Recreate the candidate details function with resume information
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

-- Recreate the candidate stats function
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

-- Create a function to get resume download URL with access control
CREATE OR REPLACE FUNCTION get_candidate_resume_url(
  p_candidate_id UUID,
  p_profile_id UUID
)
RETURNS TABLE (
  resume_id UUID,
  original_filename TEXT,
  public_url TEXT,
  file_size BIGINT,
  file_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify access: candidate must belong to a job owned by the profile
  IF NOT EXISTS (
    SELECT 1 FROM candidates c
    INNER JOIN jobs j ON c.job_id = j.id
    WHERE c.id = p_candidate_id AND j.profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'Access denied: candidate not found or not owned by profile';
  END IF;

  RETURN QUERY
  SELECT 
    cr.id,
    cr.original_filename,
    cr.public_url,
    cr.file_size,
    cr.file_type
  FROM candidate_resumes cr
  INNER JOIN candidates c ON (cr.candidate_id = c.id OR cr.email = c.email)
  WHERE c.id = p_candidate_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_resume_url(UUID, UUID) TO authenticated;

-- Grant select on the updated view to authenticated users
GRANT SELECT ON candidate_details TO authenticated;

-- Add helpful comments
COMMENT ON VIEW candidate_details IS 'Comprehensive view of candidates with job, evaluation, and resume data for efficient querying';
COMMENT ON FUNCTION get_job_candidate_details IS 'Get paginated candidate details for a specific job with resume information and enhanced search';
COMMENT ON FUNCTION get_job_candidate_stats IS 'Get statistical summary of candidates for a job';
COMMENT ON FUNCTION get_candidate_resume_url IS 'Get secure resume download URL for a candidate with access control';

-- Create indexes for better performance with resume searches
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_candidate_id_email ON candidate_resumes(candidate_id, email);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_job_email ON candidate_resumes(job_id, email); 