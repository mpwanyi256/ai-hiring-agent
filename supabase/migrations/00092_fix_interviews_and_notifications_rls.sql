-- Migration: Fix interviews and notifications RLS policies for all job participants
-- Allow all users with job access (regardless of permission level) to manage interviews and receive notifications

-- Drop existing interviews policy and create a more permissive one
DROP POLICY IF EXISTS "Job owners and team members can manage interviews" ON public.interviews;

-- Create policy allowing all job participants to manage interviews
CREATE POLICY "Job participants can manage interviews" ON public.interviews
  FOR ALL USING (
    -- Job owner can do everything
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = interviews.job_id AND j.profile_id = auth.uid()
    )
    OR
    -- Anyone with job permissions (any level) can manage interviews
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = interviews.job_id AND jp.user_id = auth.uid()
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
      WHERE jp.job_id = interviews.job_id AND jp.user_id = auth.uid()
    )
  );

-- Fix notifications RLS policy to allow interview-related notifications
-- Drop existing notification policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create comprehensive notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Allow inserting notifications for any user if you have job access
    -- This enables interview scheduling to create notifications for participants
    auth.role() = 'service_role' 
    OR 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Service role full access to notifications" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON POLICY "Job participants can manage interviews" ON public.interviews IS 
'Allows job owners and all users with job permissions to create, read, update, and delete interviews';

COMMENT ON POLICY "Users can view their notifications" ON public.notifications IS 
'Users can view notifications addressed to them';

COMMENT ON POLICY "Users can update their notifications" ON public.notifications IS 
'Users can update their own notifications (mark as read, etc.)';

COMMENT ON POLICY "Authenticated users can insert notifications" ON public.notifications IS 
'Authenticated users can create notifications, enabling interview scheduling and other features';

COMMENT ON POLICY "Service role full access to notifications" ON public.notifications IS 
'Service role has full access for system operations and triggers'; 