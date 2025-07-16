-- Create a view for candidate pipeline by company, only for jobs that are not closed
CREATE OR REPLACE VIEW public.company_candidate_pipeline AS
SELECT
  comp.id AS company_id,
  comp.name,
  c.status,
  COUNT(c.id) AS count
FROM candidates c
JOIN jobs j ON c.job_id = j.id
JOIN profiles p ON j.profile_id = p.id
JOIN companies comp ON p.company_id = comp.id
WHERE j.status != 'closed'
GROUP BY comp.id, c.status;  

-- Set security invokers
ALTER VIEW public.company_candidate_pipeline SET (security_invoker = on);

GRANT SELECT ON public.company_candidate_pipeline TO authenticated;