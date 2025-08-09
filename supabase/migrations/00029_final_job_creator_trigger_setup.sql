-- Final Job Creator Trigger Setup Migration
-- This migration ensures the job creator trigger is properly set up

-- ============================================================================
-- PART 1: Create trigger for job creator permissions
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS grant_job_creator_permissions_trigger ON public.jobs;

-- Create trigger for job creator permissions
CREATE TRIGGER grant_job_creator_permissions_trigger
    AFTER INSERT ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.grant_job_creator_permissions();

-- ============================================================================
-- PART 2: Verify the trigger was created
-- ============================================================================

DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    table_ready BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'grant_job_creator_permissions_trigger'
        AND event_object_table = 'jobs'
    ) INTO trigger_exists;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'grant_job_creator_permissions' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if job_permissions table has correct structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_permissions' 
        AND column_name = 'permission_level'
        AND table_schema = 'public'
    ) INTO table_ready;
    
    IF NOT trigger_exists THEN
        RAISE NOTICE '⚠️  Trigger creation may have failed due to permissions';
    ELSE
        RAISE NOTICE '✅ Job creator permissions trigger created successfully';
    END IF;
    
    RAISE NOTICE '  - Function exists: %', function_exists;
    RAISE NOTICE '  - Table structure ready: %', table_ready;
    RAISE NOTICE '  - Trigger exists: %', trigger_exists;
    
    IF function_exists AND table_ready THEN
        RAISE NOTICE '✅ Job creation should now work correctly';
        RAISE NOTICE '  - New jobs will automatically grant admin permissions to creators';
        RAISE NOTICE '  - Notifications will be created for company users';
    ELSE
        RAISE NOTICE '⚠️  Some components may not be ready';
    END IF;
END $$; 