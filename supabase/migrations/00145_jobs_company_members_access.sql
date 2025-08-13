-- 00145_jobs_company_members_access.sql
-- Allow company members to view all company jobs and ensure views align

SET search_path = public;

ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;

-- Company members can view company jobs
DROP POLICY IF EXISTS "Company members can view company jobs" ON public.jobs;
CREATE POLICY "Company members can view company jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = public.jobs.profile_id
        AND p.company_id = public.current_company_id()
    )
  );

-- Ensure existing views are security invoker and have grants
ALTER VIEW public.jobs_detailed SET (security_invoker = on);
ALTER VIEW public.user_jobs SET (security_invoker = on);
ALTER VIEW public.company_jobs SET (security_invoker = on);
ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);

GRANT SELECT ON public.jobs_detailed TO authenticator, authenticated, anon, service_role;
GRANT SELECT ON public.user_jobs TO authenticator, authenticated, anon, service_role;
GRANT SELECT ON public.company_jobs TO authenticator, authenticated, anon, service_role;
GRANT SELECT ON public.jobs_comprehensive TO authenticator, authenticated, anon, service_role; 