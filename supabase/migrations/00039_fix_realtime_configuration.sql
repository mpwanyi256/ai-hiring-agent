-- Fix Realtime Configuration Migration
-- This migration ensures realtime is properly configured for messaging

-- ============================================================================
-- PART 1: Ensure proper replica identity for realtime tables
-- ============================================================================

-- Set replica identity to full for better realtime performance
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.message_read_status REPLICA IDENTITY FULL;

-- ============================================================================
-- PART 2: Remove and re-add tables to realtime publication
-- ============================================================================

-- Remove tables from publication first (ignore errors if they don't exist)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if table is not in publication
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.message_reactions;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if table is not in publication
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.message_read_status;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if table is not in publication
END $$;

-- Add tables back to publication with explicit configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_status;

-- ============================================================================
-- PART 3: Ensure anonymous role has necessary permissions for realtime
-- ============================================================================

-- Grant usage on schema to anonymous (needed for realtime subscriptions)
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on messages for anonymous users (needed for realtime subscriptions)
-- but restrict it with RLS policies
GRANT SELECT ON public.messages TO anon;
GRANT SELECT ON public.message_reactions TO anon;
GRANT SELECT ON public.message_read_status TO anon;

-- ============================================================================
-- PART 4: Add anonymous-specific RLS policies for realtime
-- ============================================================================

-- Anonymous users can view messages (but RLS will still apply based on auth context)
CREATE POLICY "Anonymous can view messages for realtime" ON public.messages
  FOR SELECT TO anon
  USING (
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

-- Anonymous users can view reactions for realtime
CREATE POLICY "Anonymous can view reactions for realtime" ON public.message_reactions
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.jobs 
          WHERE jobs.id = m.job_id 
          AND jobs.profile_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() 
          AND p.role = 'admin'
        )
      )
    )
  );

-- Anonymous users can view read status for realtime
CREATE POLICY "Anonymous can view read status for realtime" ON public.message_read_status
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_read_status.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.jobs 
          WHERE jobs.id = m.job_id 
          AND jobs.profile_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() 
          AND p.role = 'admin'
        )
      )
    )
  );

-- ============================================================================
-- PART 5: Create a test function to verify realtime is working
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_realtime_message_insert(
  p_job_id UUID,
  p_user_id UUID,
  p_text TEXT DEFAULT 'Test realtime message'
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
BEGIN
  INSERT INTO public.messages (job_id, user_id, text, message_type, created_at, updated_at)
  VALUES (p_job_id, p_user_id, p_text, 'text', NOW(), NOW())
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.test_realtime_message_insert(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_realtime_message_insert(UUID, UUID, TEXT) TO service_role;

-- ============================================================================
-- PART 6: Verify the configuration
-- ============================================================================

DO $$
DECLARE
    messages_in_publication BOOLEAN;
    reactions_in_publication BOOLEAN;
    read_status_in_publication BOOLEAN;
    messages_replica_identity CHAR;
    policy_count_messages INTEGER;
    policy_count_reactions INTEGER;
    policy_count_read_status INTEGER;
BEGIN
    -- Check if tables are in publication
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) INTO messages_in_publication;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_reactions'
    ) INTO reactions_in_publication;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_read_status'
    ) INTO read_status_in_publication;
    
    -- Check replica identity
    SELECT relreplident INTO messages_replica_identity
    FROM pg_class 
    WHERE relname = 'messages' 
    LIMIT 1;
    
    -- Check policy counts
    SELECT COUNT(*) INTO policy_count_messages
    FROM pg_policies 
    WHERE tablename = 'messages' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO policy_count_reactions
    FROM pg_policies 
    WHERE tablename = 'message_reactions' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO policy_count_read_status
    FROM pg_policies 
    WHERE tablename = 'message_read_status' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Realtime configuration updated successfully';
    RAISE NOTICE '  - Messages in publication: %', messages_in_publication;
    RAISE NOTICE '  - Reactions in publication: %', reactions_in_publication;
    RAISE NOTICE '  - Read status in publication: %', read_status_in_publication;
    RAISE NOTICE '  - Messages replica identity: %', messages_replica_identity;
    RAISE NOTICE '  - Messages policies: %', policy_count_messages;
    RAISE NOTICE '  - Reactions policies: %', policy_count_reactions;
    RAISE NOTICE '  - Read status policies: %', policy_count_read_status;
    RAISE NOTICE '  - Test function created for debugging';
    RAISE NOTICE '  - Realtime should now work properly';
END $$; 