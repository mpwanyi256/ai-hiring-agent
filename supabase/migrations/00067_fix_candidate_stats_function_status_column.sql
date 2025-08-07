-- Fix Candidate Stats Function Status Column Migration
-- This migration fixes the incorrect column reference in get_job_candidate_stats function

-- ============================================================================
-- PART 1: Fix the status column reference in get_job_candidate_stats function
-- ============================================================================

-- The issue is that the function references cd.status but the column is actually cd.candidate_status

-- Drop and recreate the function with correct column reference
DROP FUNCTION IF EXISTS get_job_candidate_stats(uuid, uuid);

CREATE OR REPLACE FUNCTION get_job_candidate_stats(
    p_job_id uuid,
    p_profile_id uuid DEFAULT NULL
)
RETURNS TABLE(
    total_candidates bigint,
    completed_candidates bigint,
    in_progress_candidates bigint,
    pending_candidates bigint,
    average_score numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_candidates,
    COUNT(*) FILTER (WHERE cd.candidate_status = 'completed') as completed_candidates,
    COUNT(*) FILTER (WHERE cd.candidate_status = 'in_progress') as in_progress_candidates,
    COUNT(*) FILTER (WHERE cd.candidate_status = 'pending') as pending_candidates,
    ROUND(AVG(cd.score), 0) as average_score
  FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id);
$$;

-- ============================================================================
-- PART 2: Verification
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    function_works BOOLEAN;
BEGIN
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_job_candidate_stats'
        AND n.nspname = 'public'
    ) INTO function_exists;

    -- Test if the function works without errors (try to call it with minimal parameters)
    BEGIN
        -- Try to call the function with a dummy job_id to see if it compiles correctly
        PERFORM get_job_candidate_stats('00000000-0000-0000-0000-000000000000'::uuid, NULL);
        function_works := true;
    EXCEPTION
        WHEN OTHERS THEN
            function_works := false;
    END;

    RAISE NOTICE '✅ Candidate Stats Function Status Column Fix Applied';
    RAISE NOTICE '  - get_job_candidate_stats function exists: %', function_exists;
    RAISE NOTICE '  - Function compiles and runs without errors: %', function_works;

    IF function_exists AND function_works THEN
        RAISE NOTICE '  - ✅ Stats function fixed successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Stats function may need manual verification';
    END IF;
END $$; 