-- Create interview_conflicts view for the check-conflicts endpoint
-- This view joins interviews with candidates_info and jobs to provide all necessary data

DROP VIEW IF EXISTS interview_details;

CREATE OR REPLACE VIEW interview_details AS
SELECT 
  i.id as interview_id,
  i.application_id,
  i.job_id,
  i.date as interview_date,
  i.time as interview_time,
  i.timezone_id,
  i.duration,
  i.status as interview_status,
  i.notes,
  i.meet_link,
  i.calendar_event_id,
  i.created_at,
  i.updated_at,
  -- Candidate info
  ci.first_name as candidate_first_name,
  ci.last_name as candidate_last_name,
  ci.email as candidate_email,
  CONCAT(ci.first_name, ' ', COALESCE(ci.last_name, '')) as candidate_name,
  -- Job info
  j.title as job_title,
  j.profile_id as job_owner_id,

  -- Company info
  cm.name as company_name,
  cm.id as company_id,
  i.title as event_summary,

  -- Get creator info as JSON object
  json_build_object(
    'id', p.id,
    'name', CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')),
    'email', p.email
  ) as organizer_info

FROM interviews i
LEFT JOIN candidates c ON i.application_id = c.id
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN profiles p ON j.profile_id = p.id
LEFT JOIN companies cm ON p.company_id = cm.id;

-- Add RLS policies for the view
ALTER VIEW interview_details SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON interview_details TO authenticated;

-- Add helpful comment
COMMENT ON VIEW interview_details IS 'View for checking interview conflicts. Includes interview details with candidate names and job titles for the check-conflicts endpoint.'; 