-- Update interviews table RLS policies to allow users with job access to view scheduled events
-- This allows team members with job permissions to see interview schedules

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view interviews for their jobs" ON interviews;
DROP POLICY IF EXISTS "Users can create interviews for their jobs" ON interviews;
DROP POLICY IF EXISTS "Users can update interviews for their jobs" ON interviews;
DROP POLICY IF EXISTS "Users can delete interviews for their jobs" ON interviews;

-- Create enhanced RLS policies that include job permission checks

-- Users can view interviews for jobs they have access to (job owner, admin, or have job permissions)
CREATE POLICY "Users can view interviews for accessible jobs" ON interviews
  FOR SELECT USING (
    -- Job owner can view
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR
    -- Users with job permissions can view
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = interviews.job_id
      AND jp.user_id = auth.uid()
    )
    OR
    -- Admin users can view
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Users can create interviews for jobs they have access to (interviewer+ level)
CREATE POLICY "Users can create interviews for accessible jobs" ON interviews
  FOR INSERT WITH CHECK (
    -- Job owner can create
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR
    -- Users with interviewer+ permissions can create
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = interviews.job_id
      AND jp.user_id = auth.uid()
      AND jp.permission_level IN ('interviewer', 'manager', 'admin')
    )
    OR
    -- Admin users can create
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Users can update interviews for jobs they have access to (interviewer+ level)
CREATE POLICY "Users can update interviews for accessible jobs" ON interviews
  FOR UPDATE USING (
    -- Job owner can update
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR
    -- Users with interviewer+ permissions can update
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = interviews.job_id
      AND jp.user_id = auth.uid()
      AND jp.permission_level IN ('interviewer', 'manager', 'admin')
    )
    OR
    -- Admin users can update
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Users can delete interviews for jobs they have access to (manager+ level)
CREATE POLICY "Users can delete interviews for accessible jobs" ON interviews
  FOR DELETE USING (
    -- Job owner can delete
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR
    -- Users with manager+ permissions can delete
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = interviews.job_id
      AND jp.user_id = auth.uid()
      AND jp.permission_level IN ('manager', 'admin')
    )
    OR
    -- Admin users can delete
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Add comments
COMMENT ON POLICY "Users can view interviews for accessible jobs" ON interviews IS 'Allow users with job access to view interview schedules';
COMMENT ON POLICY "Users can create interviews for accessible jobs" ON interviews IS 'Allow interviewers and above to schedule interviews';
COMMENT ON POLICY "Users can update interviews for accessible jobs" ON interviews IS 'Allow interviewers and above to modify interviews';
COMMENT ON POLICY "Users can delete interviews for accessible jobs" ON interviews IS 'Allow managers and above to delete interviews'; 