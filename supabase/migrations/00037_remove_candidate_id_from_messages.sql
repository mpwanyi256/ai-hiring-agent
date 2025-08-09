-- Remove Candidate ID from Messages Table Migration
-- This migration removes candidate_id from messages table to make it job-specific only
-- Based on old migration: 20250122000016_remove_candidate_id_from_messages.sql

-- ============================================================================
-- PART 1: Drop dependent objects first
-- ============================================================================

-- Drop existing functions that use candidate_id
DROP FUNCTION IF EXISTS public.get_candidate_messages(UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_unread_message_count(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID[], UUID);
DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID[], UUID, UUID);
DROP FUNCTION IF EXISTS public.get_job_messages(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_unread_message_count(UUID, UUID);

-- Drop existing indexes that include candidate_id
DROP INDEX IF EXISTS idx_messages_candidate_id;
DROP INDEX IF EXISTS idx_messages_candidate_job;

-- Drop ALL possible existing RLS policies
DROP POLICY IF EXISTS "Users can view messages for accessible candidates" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for accessible candidates" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for accessible jobs" ON public.messages;

-- ============================================================================
-- PART 2: Remove candidate_id column from messages table
-- ============================================================================

-- Remove candidate_id column from messages table
ALTER TABLE public.messages DROP COLUMN IF EXISTS candidate_id;

-- ============================================================================
-- PART 3: Update indexes to be job-based only
-- ============================================================================

-- Create new indexes for job-based messaging
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON public.messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_job_created ON public.messages(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_job ON public.messages(user_id, job_id);

-- ============================================================================
-- PART 4: Create new RLS policies based on job access only
-- ============================================================================

-- Create RLS policies for job-based messaging
CREATE POLICY "Users can view messages for accessible jobs" ON public.messages
  FOR SELECT USING (
    -- Job owner can view
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = messages.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR
    -- Users with job permissions can view
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = messages.job_id
      AND jp.user_id = auth.uid()
    )
    OR
    -- Admin users can view
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      -- Job owner can send
      EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE jobs.id = messages.job_id 
        AND jobs.profile_id = auth.uid()
      )
      OR
      -- Users with job permissions can send
      EXISTS (
        SELECT 1 FROM public.job_permissions jp
        WHERE jp.job_id = messages.job_id
        AND jp.user_id = auth.uid()
      )
      OR
      -- Admin users can send
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- PART 5: Create new function to get job messages (replacing get_candidate_messages)
-- ============================================================================

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
-- PART 6: Create function to get unread message count for a job
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_unread_message_count(
  p_job_id UUID,
  p_user_id UUID
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages m
    WHERE m.job_id = p_job_id
    AND m.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.message_read_status mrs
      WHERE mrs.message_id = m.id
      AND mrs.user_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Update the mark_messages_as_read function to work with job-based messages
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_message_ids UUID[],
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  marked_count INTEGER := 0;
  msg_id UUID;
  rows_affected INTEGER;
BEGIN
  -- Mark each message as read
  FOREACH msg_id IN ARRAY p_message_ids
  LOOP
    INSERT INTO public.message_read_status (message_id, user_id, read_at)
    VALUES (msg_id, p_user_id, NOW())
    ON CONFLICT (message_id, user_id) DO NOTHING;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    marked_count := marked_count + rows_affected;
  END LOOP;
  
  RETURN marked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: Grant execute permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID[], UUID) TO service_role;

-- ============================================================================
-- PART 9: Recreate messages_detailed view to remove candidate references
-- ============================================================================

CREATE OR REPLACE VIEW public.messages_detailed AS
SELECT 
  m.id,
  m.text,
  m.user_id,
  m.job_id,
  m.reply_to_id,
  m.attachment_url,
  m.attachment_name,
  m.attachment_size,
  m.attachment_type,
  m.created_at,
  m.updated_at,
  m.edited_at,
  m.status,
  
  -- User details
  p.first_name as user_first_name,
  p.last_name as user_last_name,
  p.email as user_email,
  p.role as user_role,
  
  -- Job details
  j.title as job_title,
  
  -- Reply message details
  rm.text as reply_to_text,
  rp.first_name as reply_to_user_first_name,
  rp.last_name as reply_to_user_last_name
  
FROM public.messages m
LEFT JOIN public.profiles p ON m.user_id = p.id
LEFT JOIN public.jobs j ON m.job_id = j.id
LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
LEFT JOIN public.profiles rp ON rm.user_id = rp.id;

-- ============================================================================
-- PART 10: Grant permissions for the updated view
-- ============================================================================

GRANT SELECT ON public.messages_detailed TO authenticated;
GRANT SELECT ON public.messages_detailed TO service_role;

-- ============================================================================
-- PART 11: Add comments
-- ============================================================================

COMMENT ON FUNCTION public.get_job_messages(UUID, INTEGER, INTEGER) IS 'Get messages for a specific job with user details';
COMMENT ON FUNCTION public.get_unread_message_count(UUID, UUID) IS 'Get count of unread messages for a user in a specific job';
COMMENT ON TABLE public.messages IS 'Job-based team discussion messages';

-- ============================================================================
-- PART 12: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    has_candidate_id BOOLEAN;
    function_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check column count
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND table_schema = 'public';
    
    -- Check if candidate_id was removed
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'candidate_id' 
        AND table_schema = 'public'
    ) INTO has_candidate_id;
    
    -- Check function count
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('get_job_messages', 'get_unread_message_count', 'mark_messages_as_read');
    
    -- Check policy count
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'messages' AND schemaname = 'public';
    
    -- Check index count
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'messages' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Candidate ID removed from messages table successfully';
    RAISE NOTICE '  - Column count: %', column_count;
    RAISE NOTICE '  - Candidate ID column exists: %', has_candidate_id;
    RAISE NOTICE '  - Functions created: %', function_count;
    RAISE NOTICE '  - RLS policies: %', policy_count;
    RAISE NOTICE '  - Indexes: %', index_count;
    RAISE NOTICE '  - Messages are now job-specific only';
    RAISE NOTICE '  - Message sending should now work correctly';
END $$; 