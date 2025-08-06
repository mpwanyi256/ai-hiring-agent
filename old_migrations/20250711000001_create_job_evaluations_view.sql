-- Create job_evaluations view to replace lengthy evaluations queries
CREATE OR REPLACE VIEW job_evaluations AS
SELECT
  e.id,
  e.candidate_id,
  e.evaluation_type,
  e.summary,
  e.score,
  e.resume_score,
  e.strengths,
  e.red_flags,
  e.recommendation,
  e.feedback,
  e.created_at,
  e.job_id,
  ci.first_name AS candidate_first_name,
  ci.last_name AS candidate_last_name,
  ci.email AS candidate_email,
  CONCAT(ci.first_name, ' ', COALESCE(ci.last_name, '')) AS candidate_name
FROM evaluations e
JOIN candidates c ON e.candidate_id = c.id
JOIN candidates_info ci ON c.candidate_info_id = ci.id;

-- Add RLS policies for the view
ALTER VIEW job_evaluations SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON job_evaluations TO authenticated; 