-- Add Missing Job Creator Trigger Migration
-- This migration adds the missing trigger for job creator permissions

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
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'grant_job_creator_permissions_trigger'
        AND event_object_table = 'jobs'
    ) INTO trigger_exists;
    
    IF NOT trigger_exists THEN
        RAISE EXCEPTION 'grant_job_creator_permissions_trigger was not created successfully';
    END IF;
    
    RAISE NOTICE '✅ Job creator permissions trigger created successfully';
    RAISE NOTICE '  - Trigger exists: %', trigger_exists;
    RAISE NOTICE '  - New jobs will now automatically grant permissions to creators';
END $$; 