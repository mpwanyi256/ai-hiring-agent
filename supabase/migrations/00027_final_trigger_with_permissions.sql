-- Final Trigger with Permissions Migration
-- This migration adds the trigger with proper permissions

-- ============================================================================
-- PART 1: Grant necessary permissions for trigger creation
-- ============================================================================

-- Grant trigger permissions on jobs table
GRANT TRIGGER ON public.jobs TO postgres;
GRANT TRIGGER ON public.jobs TO service_role;

-- ============================================================================
-- PART 2: Create trigger for job creator permissions
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS grant_job_creator_permissions_trigger ON public.jobs;

-- Create trigger for job creator permissions
CREATE TRIGGER grant_job_creator_permissions_trigger
    AFTER INSERT ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.grant_job_creator_permissions();

-- ============================================================================
-- PART 3: Grant permissions on the function
-- ============================================================================

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.grant_job_creator_permissions() TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_job_creator_permissions() TO postgres;

-- ============================================================================
-- PART 4: Verify the trigger was created
-- ============================================================================

DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'grant_job_creator_permissions_trigger'
        AND event_object_table = 'jobs'
    ) INTO trigger_exists;
    
    IF NOT trigger_exists THEN
        RAISE NOTICE '⚠️  Trigger creation may have failed due to permissions';
        RAISE NOTICE '  - Function exists: %', EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'grant_job_creator_permissions'
        );
    ELSE
        RAISE NOTICE '✅ Job creator permissions trigger created successfully';
        RAISE NOTICE '  - Trigger exists: %', trigger_exists;
        RAISE NOTICE '  - New jobs will now automatically grant permissions to creators';
    END IF;
END $$; 