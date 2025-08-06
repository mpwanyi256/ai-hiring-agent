-- Fix candidate_id usage in all related tables and views
-- Ensure all foreign keys and queries use candidates.id as the candidate identifier
-- Only use candidate_info_id for joining to personal info

-- 1. Ensure evaluations, responses, candidate_resumes, etc. use candidates.id as candidate_id
-- (Assume all these tables already have candidate_id as UUID referencing candidates.id)
-- If any triggers or functions use candidate_info_id as the main identifier, revert to using id

-- 2. Fix candidate_details view to join on candidates.id for all relationships
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

-- 3. Ensure all functions and queries use candidates.id as the candidate identifier
-- (No changes needed to table structure, just views and queries)

-- 4. Add helpful comment
COMMENT ON VIEW candidate_details IS 'Comprehensive view of candidates with job, evaluation, and resume data. Uses candidates.id as the unique candidate identifier.'; 