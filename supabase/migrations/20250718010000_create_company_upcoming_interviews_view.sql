-- Create a view for upcoming interviews by company
CREATE OR REPLACE VIEW public.company_upcoming_interviews AS
SELECT
  i.id AS interview_id,
  i.date AS interview_date,
  i.time AS interview_time,
  i.status AS interview_status,
  i.calendar_event_id,
  i.meet_link,
  c.id AS candidate_id,
  cd.first_name AS candidate_first_name,
  cd.last_name AS candidate_last_name,
  cd.email AS candidate_email,
  j.id AS job_id,
  j.title AS job_title,
  comp.id AS company_id,
  comp.name AS company_name
FROM interviews i
JOIN candidates c ON i.application_id = c.id
JOIN candidate_details cd ON c.id = cd.id
JOIN jobs j ON c.job_id = j.id
JOIN profiles p ON j.profile_id = p.id
JOIN companies comp ON p.company_id = comp.id
WHERE (
    (i.date > CURRENT_DATE)
    OR (i.date = CURRENT_DATE AND i.time > CURRENT_TIME)
  );

-- Set security invokers
ALTER VIEW public.company_upcoming_interviews SET (security_invoker = on);
GRANT SELECT ON public.company_upcoming_interviews TO authenticated;