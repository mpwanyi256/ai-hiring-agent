-- Function to automatically add job creator to permissions
CREATE OR REPLACE FUNCTION auto_add_job_creator_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add the job creator as admin to the job_permissions table
  INSERT INTO job_permissions (job_id, user_id, permission_level, granted_by, granted_at)
  VALUES (NEW.id, NEW.profile_id, 'admin', NEW.profile_id, NOW())
  ON CONFLICT (job_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add creator permissions
DROP TRIGGER IF EXISTS trigger_auto_add_job_creator_permission ON jobs;
CREATE TRIGGER trigger_auto_add_job_creator_permission
  AFTER INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_job_creator_permission();

-- Backfill existing jobs (add creators to permissions table)
INSERT INTO job_permissions (job_id, user_id, permission_level, granted_by, granted_at)
SELECT 
  j.id,
  j.profile_id,
  'admin',
  j.profile_id,
  j.created_at
FROM jobs j
WHERE NOT EXISTS (
  SELECT 1 FROM job_permissions jp 
  WHERE jp.job_id = j.id AND jp.user_id = j.profile_id
)
ON CONFLICT (job_id, user_id) DO NOTHING; 