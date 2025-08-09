-- Migration: Fix interviews RLS policy to allow team members to create interviews
-- Current policy only allows job owners to create interviews, but team members with job_permissions should also be able to

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Job owners can manage interviews" ON public.interviews;
DROP POLICY IF EXISTS "Team members can view interviews" ON public.interviews;

-- Create comprehensive policies that allow both job owners and team members to manage interviews
CREATE POLICY "Job owners and team members can manage interviews" ON public.interviews
  FOR ALL USING (
    -- Job owner can do everything
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = interviews.job_id AND j.profile_id = auth.uid()
    )
    OR
    -- Team members with job permissions can also do everything
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      JOIN public.jobs j ON jp.job_id = j.id
      WHERE j.id = interviews.job_id AND jp.user_id = auth.uid() AND jp.permission_level NOT IN ('view')
    )
  )
  WITH CHECK (
    -- Same permissions for INSERT/UPDATE
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = interviews.job_id AND j.profile_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      JOIN public.jobs j ON jp.job_id = j.id
      WHERE j.id = interviews.job_id AND jp.user_id = auth.uid() AND jp.permission_level NOT IN ('view')
    )
  );

COMMENT ON POLICY "Job owners and team members can manage interviews" ON public.interviews IS 
'Allows job owners and users with job permissions to create, read, update, and delete interviews for their jobs'; 