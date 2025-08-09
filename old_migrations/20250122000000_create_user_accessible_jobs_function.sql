-- Function to get job IDs that a user has access to
CREATE OR REPLACE FUNCTION get_user_accessible_jobs(
  p_user_id UUID,
  p_company_id UUID
) RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_ids UUID[];
BEGIN
  -- Get all job IDs that the user has access to:
  -- 1. Jobs created by the user
  -- 2. Jobs where the user has explicit permissions
  SELECT ARRAY(
    SELECT DISTINCT j.id
    FROM jobs j
    LEFT JOIN job_permissions jp ON j.id = jp.job_id AND jp.user_id = p_user_id
    WHERE j.company_id = p_company_id
      AND (
        j.profile_id = p_user_id  -- User created the job
        OR jp.id IS NOT NULL     -- User has explicit permissions
      )
    ORDER BY j.id
  ) INTO job_ids;

  RETURN job_ids;
END;
$$; 