-- Migration: Set Row Level Policies for job_permissions (non-circular, owner-driven)

-- Ensure RLS is enabled
ALTER TABLE public.job_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Job owners can manage permissions" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can manage job permissions for their jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can view job permissions for their accessible jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can view job permissions in their company" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can view their own job permissions" ON public.job_permissions;
DROP POLICY IF EXISTS "Job owners can view permissions for their jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Job owners can grant permissions for their jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Job owners can update permissions for their jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Job owners can revoke permissions for their jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Service role can manage all job permissions" ON public.job_permissions;

-- 1) Users can view their own job permission rows
CREATE POLICY "Users can view their own job permissions" ON public.job_permissions
  FOR SELECT USING (user_id = auth.uid());

-- 2) Job owners can view all permissions for their jobs (avoid circular refs; reference jobs only here)
CREATE POLICY "Job owners can view permissions for their jobs" ON public.job_permissions
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM public.jobs j WHERE j.profile_id = auth.uid()
    )
  );

-- 3) Job owners can grant permissions for their jobs
CREATE POLICY "Job owners can grant permissions for their jobs" ON public.job_permissions
  FOR INSERT WITH CHECK (
    job_id IN (
      SELECT j.id FROM public.jobs j WHERE j.profile_id = auth.uid()
    )
  );

-- 4) Job owners can update permissions for their jobs
CREATE POLICY "Job owners can update permissions for their jobs" ON public.job_permissions
  FOR UPDATE USING (
    job_id IN (
      SELECT j.id FROM public.jobs j WHERE j.profile_id = auth.uid()
    )
  ) WITH CHECK (
    job_id IN (
      SELECT j.id FROM public.jobs j WHERE j.profile_id = auth.uid()
    )
  );

-- 5) Job owners can revoke permissions for their jobs
CREATE POLICY "Job owners can revoke permissions for their jobs" ON public.job_permissions
  FOR DELETE USING (
    job_id IN (
      SELECT j.id FROM public.jobs j WHERE j.profile_id = auth.uid()
    )
  );

-- 6) Service role bypass to manage all (for server-side tasks)
CREATE POLICY "Service role can manage all job permissions" ON public.job_permissions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Helpful indexes (idempotent) to support policy subqueries and table usage
CREATE INDEX IF NOT EXISTS idx_job_permissions_job_id ON public.job_permissions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_user_id ON public.job_permissions(user_id);

COMMENT ON POLICY "Users can view their own job permissions" ON public.job_permissions IS 'Allows users to see rows where they are the grantee.';
COMMENT ON POLICY "Job owners can view permissions for their jobs" ON public.job_permissions IS 'Job owners (jobs.profile_id) can see all permissions for their jobs.';
COMMENT ON POLICY "Job owners can grant permissions for their jobs" ON public.job_permissions IS 'Job owners can INSERT permissions for their jobs.';
COMMENT ON POLICY "Job owners can update permissions for their jobs" ON public.job_permissions IS 'Job owners can UPDATE permissions for their jobs.';
COMMENT ON POLICY "Job owners can revoke permissions for their jobs" ON public.job_permissions IS 'Job owners can DELETE permissions for their jobs.';
COMMENT ON POLICY "Service role can manage all job permissions" ON public.job_permissions IS 'Service role has full access to manage job permissions.'; 