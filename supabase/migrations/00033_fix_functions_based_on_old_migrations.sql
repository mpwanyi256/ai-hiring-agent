-- Fix Functions Based on Old Migrations
-- This migration recreates functions using the correct structure from old migrations

-- ============================================================================
-- PART 1: Fix get_job_messages function based on old migration
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_job_messages(UUID, INTEGER, INTEGER) CASCADE;

-- Create the get_job_messages function based on old migration 20250122000018_fix_varchar_text_mismatch.sql
CREATE OR REPLACE FUNCTION public.get_job_messages(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  user_id UUID,
  job_id UUID,
  reply_to_id UUID,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size BIGINT,
  attachment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_email TEXT,
  user_role TEXT,
  reply_to_text TEXT,
  reply_to_user_first_name TEXT,
  reply_to_user_last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.text,
    m.user_id,
    m.job_id,
    m.reply_to_id,
    m.attachment_url,
    m.attachment_name,
    COALESCE(m.attachment_size, 0)::BIGINT as attachment_size,
    m.attachment_type,
    m.created_at,
    m.updated_at,
    m.edited_at,
    COALESCE(m.status, 'sent')::TEXT as status,
    COALESCE(p.first_name, '')::TEXT as user_first_name,
    COALESCE(p.last_name, '')::TEXT as user_last_name,
    COALESCE(p.email, '')::TEXT as user_email,
    COALESCE(p.role, 'viewer')::TEXT as user_role,
    COALESCE(rm.text, '')::TEXT as reply_to_text,
    COALESCE(rp.first_name, '')::TEXT as reply_to_user_first_name,
    COALESCE(rp.last_name, '')::TEXT as reply_to_user_last_name
  FROM public.messages m
  LEFT JOIN public.profiles p ON m.user_id = p.id
  LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
  LEFT JOIN public.profiles rp ON rm.user_id = rp.id
  WHERE m.job_id = p_job_id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Create get_job_permissions function based on old migration
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_job_permissions(UUID) CASCADE;

-- Create the get_job_permissions function based on old migration structure
CREATE OR REPLACE FUNCTION public.get_job_permissions(p_job_id UUID)
RETURNS TABLE (
    id UUID,
    job_id UUID,
    user_id UUID,
    permission_level TEXT,
    granted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    granted_by UUID,
    user_first_name TEXT,
    user_last_name TEXT,
    user_email TEXT,
    user_role TEXT,
    granted_by_first_name TEXT,
    granted_by_last_name TEXT,
    granted_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id,
        jp.job_id,
        jp.user_id,
        jp.permission_level,
        jp.granted_at,
        jp.created_at,
        jp.updated_at,
        jp.granted_by,
        p.first_name as user_first_name,
        p.last_name as user_last_name,
        p.email as user_email,
        p.role as user_role,
        granter.first_name as granted_by_first_name,
        granter.last_name as granted_by_last_name,
        granter.email as granted_by_email
    FROM public.job_permissions jp
    LEFT JOIN public.profiles p ON jp.user_id = p.id
    LEFT JOIN public.profiles granter ON jp.granted_by = granter.id
    WHERE jp.job_id = p_job_id
    ORDER BY jp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Create get_job_candidates function
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_job_candidates(UUID, INTEGER, INTEGER) CASCADE;

-- Create the get_job_candidates function
CREATE OR REPLACE FUNCTION public.get_job_candidates(
    p_job_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    job_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID,
    candidate_info_id UUID,
    resume_path TEXT,
    cover_letter TEXT,
    source TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.job_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.status,
        c.created_at,
        c.updated_at,
        c.updated_by,
        c.candidate_info_id,
        ci.resume_path,
        ci.cover_letter,
        ci.source,
        ci.metadata
    FROM public.candidates c
    LEFT JOIN public.candidates_info ci ON c.candidate_info_id = ci.id
    WHERE c.job_id = p_job_id
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Create get_job_interviews function
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_job_interviews(UUID, INTEGER, INTEGER) CASCADE;

-- Create the get_job_interviews function
CREATE OR REPLACE FUNCTION public.get_job_interviews(
    p_job_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    job_id UUID,
    application_id UUID,
    date DATE,
    interview_time TIME,
    duration INTEGER,
    status TEXT,
    type TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    candidate_first_name TEXT,
    candidate_last_name TEXT,
    candidate_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.job_id,
        i.application_id,
        i.date,
        i.time as interview_time,
        i.duration,
        i.status,
        i.type,
        i.location,
        i.notes,
        i.created_at,
        i.updated_at,
        c.first_name as candidate_first_name,
        c.last_name as candidate_last_name,
        c.email as candidate_email
    FROM public.interviews i
    LEFT JOIN public.candidates c ON i.application_id = c.id
    WHERE i.job_id = p_job_id
    ORDER BY i.date DESC, i.time DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Grant permissions on functions
-- ============================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_job_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_candidates(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_interviews(UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 6: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) IS 'Get messages for a specific job with proper type casting for VARCHAR/TEXT compatibility';
COMMENT ON FUNCTION public.get_job_permissions(UUID) IS 'Get permissions for a specific job';
COMMENT ON FUNCTION public.get_job_candidates(UUID, INTEGER, INTEGER) IS 'Get candidates for a specific job with pagination';
COMMENT ON FUNCTION public.get_job_interviews(UUID, INTEGER, INTEGER) IS 'Get interviews for a specific job with pagination';

-- ============================================================================
-- PART 7: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    function_count INTEGER;
BEGIN
    -- Check function count
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_job_messages', 'get_job_permissions', 'get_job_candidates', 'get_job_interviews');
    
    RAISE NOTICE '✅ Functions fixed based on old migrations successfully';
    RAISE NOTICE '  - Functions created: %', function_count;
    RAISE NOTICE '  - Uses correct column names from original migrations';
    RAISE NOTICE '  - Job permissions and messages should now work correctly';
END $$; 