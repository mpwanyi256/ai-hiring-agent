-- 00147_update_get_user_accessible_jobs_fix.sql
-- Redefine get_user_accessible_jobs to use profiles.company_id and preserve original signature/return type

SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_accessible_jobs(
  p_company_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_id UUID,
  permission_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT j.id,
         j.title,
         owner.company_id AS company_id,
         CASE 
           WHEN j.profile_id = p_user_id THEN 'owner'
           WHEN jp.permission_type IS NOT NULL THEN jp.permission_type
           ELSE 'view'
         END AS permission_type
  FROM public.jobs j
  JOIN public.profiles owner ON owner.id = j.profile_id
  LEFT JOIN public.job_permissions jp 
    ON jp.job_id = j.id AND jp.user_id = p_user_id
  WHERE owner.company_id = p_company_id
    AND (j.profile_id = p_user_id OR jp.user_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_accessible_jobs(UUID, UUID) TO authenticated; 