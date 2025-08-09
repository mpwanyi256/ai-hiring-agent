-- Simplified function to get job IDs that a user has access to
-- Now that creators are automatically added to job_permissions, we only need to check permissions
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
  -- Get all job IDs from job_permissions where the user has access
  -- This now includes job creators (automatically added) and explicitly granted permissions
  SELECT ARRAY(
    SELECT DISTINCT jp.job_id
    FROM job_permissions jp
    INNER JOIN jobs j ON j.id = jp.job_id
    WHERE jp.user_id = p_user_id
      AND j.company_id = p_company_id
    ORDER BY jp.job_id
  ) INTO job_ids;

  RETURN job_ids;
END;
$$; 