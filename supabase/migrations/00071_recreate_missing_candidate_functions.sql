-- Recreate Missing Candidate Functions Migration
-- This migration recreates the missing get_candidate_with_info function and other candidate-related functions

-- ============================================================================
-- PART 1: Create get_candidate_with_info function
-- ============================================================================

-- This function gets candidate details by candidate ID (from candidates table)
CREATE OR REPLACE FUNCTION get_candidate_with_info(p_candidate_id UUID)
RETURNS JSON AS $$
DECLARE
  candidate_record RECORD;
  result JSON;
BEGIN
  -- Use the candidate_details view to get comprehensive candidate information
  SELECT * INTO candidate_record 
  FROM candidate_details 
  WHERE id = p_candidate_id;
  
  IF candidate_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Candidate not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'candidate', to_json(candidate_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Create get_candidate_details function (by interview token)
-- ============================================================================

-- This function gets candidate details by interview token
CREATE OR REPLACE FUNCTION get_candidate_details(p_interview_token TEXT)
RETURNS JSON AS $$
DECLARE
  candidate_record RECORD;
  result JSON;
BEGIN
  -- Use the candidate_details view to get comprehensive candidate information
  SELECT * INTO candidate_record 
  FROM candidate_details 
  WHERE interview_token = p_interview_token;
  
  IF candidate_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Candidate not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'candidate', to_json(candidate_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Grant permissions to functions
-- ============================================================================

-- Grant execute permissions to the functions
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_candidate_with_info(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_candidate_details(TEXT) TO service_role;

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

DO $$
DECLARE
    get_candidate_with_info_exists BOOLEAN;
    get_candidate_details_exists BOOLEAN;
BEGIN
    -- Check if get_candidate_with_info function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_candidate_with_info'
        AND routine_schema = 'public'
    ) INTO get_candidate_with_info_exists;
    
    -- Check if get_candidate_details function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_candidate_details'
        AND routine_schema = 'public'
    ) INTO get_candidate_details_exists;
    
    RAISE NOTICE '✅ Missing Candidate Functions Recreated';
    RAISE NOTICE '  - get_candidate_with_info function exists: %', get_candidate_with_info_exists;
    RAISE NOTICE '  - get_candidate_details function exists: %', get_candidate_details_exists;
    
    IF get_candidate_with_info_exists AND get_candidate_details_exists THEN
        RAISE NOTICE '  - ✅ All missing functions recreated successfully!';
    ELSE
        RAISE NOTICE '  - ⚠️  Some functions may need manual verification';
    END IF;
END $$; 