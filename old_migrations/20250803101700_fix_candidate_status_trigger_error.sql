-- Migration: Fix candidate status trigger error
-- Description: Remove conflicting trigger function that references non-existent 'updated_by' field
-- and ensure only the new notification system is active

-- First, check if there are any triggers using the old function and remove them
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Find and drop any triggers that use the old track_candidate_status_change function
    FOR trigger_rec IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE action_statement LIKE '%track_candidate_status_change%'
        AND event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_rec.trigger_name, trigger_rec.event_object_table);
        RAISE NOTICE 'Dropped trigger % on table %', trigger_rec.trigger_name, trigger_rec.event_object_table;
    END LOOP;
END $$;

-- Drop the old conflicting function that references non-existent fields
DROP FUNCTION IF EXISTS public.track_candidate_status_change() CASCADE;

-- Drop any other conflicting functions that might reference updated_by
DROP FUNCTION IF EXISTS public.create_activity_and_notification(UUID, UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) CASCADE;

-- Ensure our new candidate status notification trigger is properly set up
-- (This should already exist from the previous migration, but we'll ensure it's correct)

-- Verify the candidates table structure and ensure the trigger function matches
DO $$
DECLARE
    has_status_column BOOLEAN;
    has_job_id_column BOOLEAN;
    has_candidate_info_id_column BOOLEAN;
BEGIN
    -- Check if required columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND table_schema = 'public' 
        AND column_name = 'status'
    ) INTO has_status_column;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND table_schema = 'public' 
        AND column_name = 'job_id'
    ) INTO has_job_id_column;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND table_schema = 'public' 
        AND column_name = 'candidate_info_id'
    ) INTO has_candidate_info_id_column;

    -- Log the table structure verification
    RAISE NOTICE 'Candidates table verification:';
    RAISE NOTICE '  - status column exists: %', has_status_column;
    RAISE NOTICE '  - job_id column exists: %', has_job_id_column;
    RAISE NOTICE '  - candidate_info_id column exists: %', has_candidate_info_id_column;

    -- Ensure all required columns exist
    IF NOT (has_status_column AND has_job_id_column AND has_candidate_info_id_column) THEN
        RAISE EXCEPTION 'Missing required columns in candidates table';
    END IF;
END $$;

-- Ensure the correct trigger exists (from our previous migration)
-- Drop and recreate to ensure it's using the correct function
DROP TRIGGER IF EXISTS trigger_candidate_status_notification ON candidates;

-- Only create the trigger if the function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'create_candidate_status_notification'
    ) THEN
        CREATE TRIGGER trigger_candidate_status_notification
            AFTER UPDATE OF status ON candidates
            FOR EACH ROW
            EXECUTE FUNCTION create_candidate_status_notification();
        
        RAISE NOTICE 'Created trigger_candidate_status_notification on candidates table';
    ELSE
        RAISE NOTICE 'Function create_candidate_status_notification does not exist - trigger not created';
    END IF;
END $$;

-- Add a comment for documentation
COMMENT ON TRIGGER trigger_candidate_status_notification ON candidates IS 'Triggers notifications for all job participants when candidate status changes';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Fixed candidate status trigger error';
    RAISE NOTICE 'Removed old conflicting functions and ensured proper notification system';
END $$;
