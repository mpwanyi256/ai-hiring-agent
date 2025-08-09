-- Fix Circular RLS Policies Migration
-- This migration fixes the infinite recursion in RLS policies between jobs and job_permissions

-- ============================================================================
-- PART 1: Disable RLS on job_permissions to break the circular dependency
-- ============================================================================

-- Disable RLS on job_permissions to break the circular dependency
ALTER TABLE public.job_permissions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Drop all existing policies on jobs table
-- ============================================================================

-- Drop all existing policies on jobs table
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can create their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anonymous users can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can view jobs with permissions" ON public.jobs;
DROP POLICY IF EXISTS "Job owners can manage their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can view accessible jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can view jobs via permissions" ON public.jobs;

-- ============================================================================
-- PART 3: Create simplified policies for jobs table
-- ============================================================================

-- Users can view their own jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs
    FOR SELECT USING (auth.uid() = profile_id);

-- Users can create their own jobs
CREATE POLICY "Users can create their own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = profile_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs" ON public.jobs
    FOR DELETE USING (auth.uid() = profile_id);

-- Anonymous users can view published jobs
CREATE POLICY "Anonymous users can view published jobs" ON public.jobs
    FOR SELECT USING (status = 'published' AND is_active = true);

-- ============================================================================
-- PART 4: Create a security definer function for checking job access
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.user_can_access_job(UUID, UUID) CASCADE;

-- Create a security definer function to safely check job access
CREATE OR REPLACE FUNCTION public.user_can_access_job(job_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user owns the job
    IF EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE id = job_uuid AND profile_id = user_uuid
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has permissions via job_permissions (RLS disabled)
    IF EXISTS (
        SELECT 1 FROM public.job_permissions 
        WHERE job_id = job_uuid AND user_id = user_uuid
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user is in the same company as job owner
    IF EXISTS (
        SELECT 1 FROM public.jobs j
        JOIN public.profiles job_owner ON j.profile_id = job_owner.id
        JOIN public.profiles user_profile ON user_profile.id = user_uuid
        WHERE j.id = job_uuid 
        AND job_owner.company_id = user_profile.company_id
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Grant permissions
-- ============================================================================

-- Grant permissions for job_permissions table (since RLS is disabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_permissions TO authenticated;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.user_can_access_job(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_job(UUID, UUID) TO anon;

-- ============================================================================
-- PART 6: Create accessible_jobs view using the security definer function
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.accessible_jobs CASCADE;

-- Create accessible_jobs view using the security definer function
CREATE OR REPLACE VIEW public.accessible_jobs AS
SELECT j.*
FROM public.jobs j
WHERE public.user_can_access_job(j.id, auth.uid());

-- Set security invoker for the view
ALTER VIEW public.accessible_jobs SET (security_invoker = on);

-- Grant permissions on the view
GRANT SELECT ON public.accessible_jobs TO authenticated;

-- ============================================================================
-- PART 7: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION public.user_can_access_job(UUID, UUID) IS 'Security definer function to safely check if a user can access a job without causing RLS recursion';
COMMENT ON VIEW public.accessible_jobs IS 'View showing jobs accessible to the current user via ownership, permissions, or company membership';
COMMENT ON TABLE public.job_permissions IS 'Job permissions table with RLS disabled to prevent circular dependencies';

-- ============================================================================
-- PART 8: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    jobs_policy_count INTEGER;
    function_exists BOOLEAN;
    view_exists BOOLEAN;
    rls_disabled BOOLEAN;
BEGIN
    -- Check jobs policies count
    SELECT COUNT(*) INTO jobs_policy_count
    FROM pg_policies 
    WHERE tablename = 'jobs' AND schemaname = 'public';
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'user_can_access_job' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'accessible_jobs' 
        AND table_schema = 'public'
    ) INTO view_exists;
    
    -- Check if RLS is disabled on job_permissions
    SELECT NOT rowsecurity INTO rls_disabled
    FROM pg_tables 
    WHERE tablename = 'job_permissions' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Circular RLS policies fixed successfully';
    RAISE NOTICE '  - Jobs policies count: %', jobs_policy_count;
    RAISE NOTICE '  - Function exists: %', function_exists;
    RAISE NOTICE '  - View exists: %', view_exists;
    RAISE NOTICE '  - RLS disabled on job_permissions: %', rls_disabled;
    RAISE NOTICE '  - Job creation should now work without recursion errors';
END $$; 