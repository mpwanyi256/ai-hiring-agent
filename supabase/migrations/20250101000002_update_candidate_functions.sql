-- Update the get_job_candidate_details function to support new filters
CREATE OR REPLACE FUNCTION get_job_candidate_details(
  p_job_id UUID,
  p_profile_id UUID,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_min_score INTEGER DEFAULT NULL,
  p_max_score INTEGER DEFAULT NULL,
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL,
  p_candidate_status TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  interview_token TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  current_step INTEGER,
  total_steps INTEGER,
  is_completed BOOLEAN,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER,
  status TEXT,
  response_count INTEGER,
  job_title TEXT,
  job_status TEXT,
  profile_id UUID,
  job_fields JSONB,
  evaluation_id UUID,
  score INTEGER,
  recommendation TEXT,
  summary TEXT,
  strengths TEXT[],
  red_flags TEXT[],
  skills_assessment JSONB,
  traits_assessment JSONB,
  evaluation_created_at TIMESTAMP WITH TIME ZONE,
  resume_id UUID,
  resume_filename TEXT,
  resume_file_path TEXT,
  resume_public_url TEXT,
  resume_file_size INTEGER,
  resume_file_type TEXT,
  resume_word_count INTEGER,
  resume_parsing_status TEXT,
  resume_parsing_error TEXT,
  resume_uploaded_at TIMESTAMP WITH TIME ZONE,
  resume_score INTEGER,
  resume_summary TEXT,
  evaluation_type TEXT,
  candidate_status candidate_status
) AS $$
BEGIN
  RETURN QUERY
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
    CASE 
      WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)::INTEGER
      ELSE 0 
    END as progress_percentage,
    CASE 
      WHEN c.is_completed AND e.id IS NOT NULL THEN 'completed'
      WHEN c.is_completed AND e.id IS NULL THEN 'completed'
      WHEN NOT c.is_completed AND c.current_step > 1 THEN 'in_progress'
      ELSE 'pending'
    END as status,
    COALESCE(response_counts.response_count, 0) as response_count,
    j.title as job_title,
    j.status as job_status,
    j.profile_id,
    j.fields as job_fields,
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
    c.status as candidate_status
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
    WHERE cr2.candidate_id = c.id
      AND cr2.job_id = c.job_id
    ORDER BY cr2.created_at DESC, cr2.id DESC
    LIMIT 1
  ) cr ON TRUE
  WHERE j.id = p_job_id 
    AND j.profile_id = p_profile_id
    AND (p_search IS NULL OR 
         ci.first_name ILIKE '%' || p_search || '%' OR 
         ci.last_name ILIKE '%' || p_search || '%' OR 
         ci.email ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR 
         (p_status = 'completed' AND c.is_completed) OR
         (p_status = 'in_progress' AND NOT c.is_completed AND c.current_step > 1) OR
         (p_status = 'pending' AND NOT c.is_completed AND c.current_step <= 1))
    AND (p_min_score IS NULL OR e.score >= p_min_score)
    AND (p_max_score IS NULL OR e.score <= p_max_score)
    AND (p_start_date IS NULL OR c.created_at >= p_start_date::TIMESTAMP WITH TIME ZONE)
    AND (p_end_date IS NULL OR c.created_at <= (p_end_date || 'T23:59:59')::TIMESTAMP WITH TIME ZONE)
    AND (p_candidate_status IS NULL OR c.status = p_candidate_status::candidate_status)
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'score' THEN e.score::TEXT
      WHEN p_sort_by = 'full_name' THEN COALESCE(NULLIF(TRIM(ci.first_name || ' ' || COALESCE(ci.last_name, '')), ''), 'Anonymous')
      WHEN p_sort_by = 'completion_percentage' THEN (CASE WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)::INTEGER ELSE 0 END)::TEXT
      WHEN p_sort_by = 'candidate_status' THEN c.status::TEXT
      ELSE c.created_at::TEXT
    END || ' ' || p_sort_order
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 