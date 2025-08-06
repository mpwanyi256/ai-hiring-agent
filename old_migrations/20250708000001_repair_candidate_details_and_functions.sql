-- Repair candidate_details view and all related functions
-- Ensure all foreign keys use candidates.id and all function signatures are correct

-- 1. Drop dependent functions first
DROP FUNCTION IF EXISTS get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_job_candidate_stats(UUID, UUID);
DROP FUNCTION IF EXISTS get_candidate_with_info(UUID);
DROP FUNCTION IF EXISTS get_candidate_details(TEXT);

-- 2. Drop and recreate the candidate_details view
DROP VIEW IF EXISTS candidate_details CASCADE;

CREATE OR REPLACE VIEW candidate_details AS
SELECT 
  c.id,
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
  
  -- Resume information (latest resume per candidate)
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
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN evaluations e ON c.id = e.candidate_id
LEFT JOIN (
  SELECT 
    candidate_id, 
    COUNT(*) as response_count
  FROM responses 
  GROUP BY candidate_id
) response_counts ON c.id = response_counts.candidate_id
LEFT JOIN LATERAL (
  SELECT * FROM candidate_resumes cr2
  WHERE (cr2.candidate_id = c.id OR cr2.email = ci.email)
    AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

-- 3. Recreate all related functions with correct signatures
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

CREATE OR REPLACE FUNCTION get_candidate_with_info(p_candidate_id UUID)
RETURNS JSON AS $$
DECLARE
  candidate_record RECORD;
  result JSON;
BEGIN
  -- Get candidate with candidate info
  SELECT 
    c.*,
    ci.first_name,
    ci.last_name,
    ci.email,
    ci.phone,
    ci.linkedin_url,
    ci.portfolio_url
  INTO candidate_record
  FROM candidates c
  LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
  WHERE c.id = p_candidate_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'candidate', json_build_object(
        'id', candidate_record.id,
        'jobId', candidate_record.job_id,
        'candidateInfoId', candidate_record.candidate_info_id,
        'interviewToken', candidate_record.interview_token,
        'currentStep', candidate_record.current_step,
        'totalSteps', candidate_record.total_steps,
        'isCompleted', candidate_record.is_completed,
        'submittedAt', candidate_record.submitted_at,
        'createdAt', candidate_record.created_at,
        'updatedAt', candidate_record.updated_at,
        'firstName', candidate_record.first_name,
        'lastName', candidate_record.last_name,
        'email', candidate_record.email,
        'phone', candidate_record.phone,
        'linkedinUrl', candidate_record.linkedin_url,
        'portfolioUrl', candidate_record.portfolio_url
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_candidate_details(p_interview_token TEXT)
RETURNS JSON AS $$
DECLARE
  candidate_record RECORD;
  result JSON;
BEGIN
  SELECT 
    c.*,
    ci.first_name,
    ci.last_name,
    ci.email,
    ci.phone,
    ci.linkedin_url,
    ci.portfolio_url
  INTO candidate_record
  FROM candidates c
  LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
  WHERE c.interview_token = p_interview_token;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'candidate', json_build_object(
        'id', candidate_record.id,
        'jobId', candidate_record.job_id,
        'candidateInfoId', candidate_record.candidate_info_id,
        'interviewToken', candidate_record.interview_token,
        'currentStep', candidate_record.current_step,
        'totalSteps', candidate_record.total_steps,
        'isCompleted', candidate_record.is_completed,
        'submittedAt', candidate_record.submitted_at,
        'createdAt', candidate_record.created_at,
        'updatedAt', candidate_record.updated_at,
        'firstName', candidate_record.first_name,
        'lastName', candidate_record.last_name,
        'email', candidate_record.email,
        'phone', candidate_record.phone,
        'linkedinUrl', candidate_record.linkedin_url,
        'portfolioUrl', candidate_record.portfolio_url
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO anon;

-- 5. Add helpful comments
COMMENT ON VIEW candidate_details IS 'Comprehensive view of candidates with job, evaluation, and resume data. Uses candidates.id as the unique candidate identifier.';
COMMENT ON FUNCTION get_job_candidate_details IS 'Get paginated candidate details for a specific job with optional filtering (fixed structure)';
COMMENT ON FUNCTION get_job_candidate_stats IS 'Get statistical summary of candidates for a job (simplified implementation)';
COMMENT ON FUNCTION get_candidate_with_info IS 'Get candidate details including candidate info';
COMMENT ON FUNCTION get_candidate_details IS 'Gets candidate details including candidate info by interview token'; 