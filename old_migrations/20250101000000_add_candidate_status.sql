-- Create candidate status enum
CREATE TYPE candidate_status AS ENUM (
  'under_review',
  'interview_scheduled', 
  'shortlisted',
  'reference_check',
  'offer_extended',
  'offer_accepted',
  'hired',
  'rejected',
  'withdrawn'
);

-- Add status field to candidates table
ALTER TABLE candidates 
ADD COLUMN status candidate_status DEFAULT 'under_review' NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_candidates_status ON candidates(status);

-- Update existing candidates to have 'under_review' status if they don't have one
UPDATE candidates 
SET status = 'under_review' 
WHERE status IS NULL;

-- Update candidate_details view to include the status field
-- Adding the status field as the last field to avoid dropping the view
CREATE OR REPLACE VIEW candidate_details AS
SELECT 
  c.id, -- Unique candidate application identifier (now matches candidates_info.id)
  c.candidate_info_id, -- Reference to personal info (same as id now)
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
  -- Progress
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  -- Job info
  j.title as job_title,
  j.status as job_status,
  j.profile_id, -- For employer filtering only
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
  -- Resume info (latest resume per candidate)
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
  -- Status derived from completion and evaluation (legacy field for backward compatibility)
  CASE 
    WHEN c.is_completed AND e.id IS NOT NULL THEN 'completed'
    WHEN c.is_completed AND e.id IS NULL THEN 'completed'
    WHEN NOT c.is_completed AND c.current_step > 1 THEN 'in_progress'
    ELSE 'pending'
  END as status,
  -- New candidate status field (added as last field)
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
) cr ON TRUE; 