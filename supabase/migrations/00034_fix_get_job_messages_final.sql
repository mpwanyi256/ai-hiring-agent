-- Fix Get Job Messages Function Final
-- This migration fixes the get_job_messages function to use the actual column names

-- ============================================================================
-- PART 1: Fix get_job_messages function with actual column names
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_job_messages(UUID, INTEGER, INTEGER) CASCADE;

-- Create the corrected get_job_messages function using actual column names
CREATE OR REPLACE FUNCTION public.get_job_messages(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_id UUID,
  job_id UUID,
  candidate_id UUID,
  sender_type TEXT,
  message_type TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  sender_first_name TEXT,
  sender_last_name TEXT,
  sender_email TEXT,
  sender_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.sender_id,
    m.job_id,
    m.candidate_id,
    m.sender_type,
    m.message_type,
    m.is_read,
    m.created_at,
    m.updated_at,
    COALESCE(p.first_name, '')::TEXT as sender_first_name,
    COALESCE(p.last_name, '')::TEXT as sender_last_name,
    COALESCE(p.email, '')::TEXT as sender_email,
    COALESCE(p.role, 'viewer')::TEXT as sender_role
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.sender_id = p.id
  WHERE m.job_id = p_job_id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Grant permissions on the function
-- ============================================================================

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO service_role;

-- ============================================================================
-- PART 3: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) IS 'Get messages for a specific job using actual column names (sender_id, content)';

-- ============================================================================
-- PART 4: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_job_messages' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    RAISE NOTICE '✅ Get job messages function fixed with actual column names';
    RAISE NOTICE '  - Function exists: %', function_exists;
    RAISE NOTICE '  - Uses actual column names (sender_id, content, etc.)';
    RAISE NOTICE '  - Job messages should now work correctly';
END $$; 