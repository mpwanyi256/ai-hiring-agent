-- Fix Realtime RLS Policies Migration
-- This migration fixes RLS policies to ensure realtime messaging works properly

-- ============================================================================
-- PART 1: Drop existing policies with incorrect role assignments
-- ============================================================================

-- Drop existing policies that have incorrect role assignments
DROP POLICY IF EXISTS "Users can view messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Drop existing policies for message_reactions
DROP POLICY IF EXISTS "Users can view reactions for accessible messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.message_reactions;

-- Drop existing policies for message_read_status
DROP POLICY IF EXISTS "Users can view read status for accessible messages" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.message_read_status;

-- ============================================================================
-- PART 2: Create proper RLS policies for messages table
-- ============================================================================

-- Users can view messages for accessible jobs
CREATE POLICY "Users can view messages for accessible jobs" ON public.messages
  FOR SELECT TO authenticated
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

-- Users can send messages for accessible jobs
CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
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

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Service role can access all messages (needed for realtime)
CREATE POLICY "Service role can access all messages" ON public.messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 3: Create proper RLS policies for message_reactions table
-- ============================================================================

-- Users can view reactions for accessible messages
CREATE POLICY "Users can view reactions for accessible messages" ON public.message_reactions
  FOR SELECT TO authenticated
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

-- Users can manage their own reactions
CREATE POLICY "Users can manage their own reactions" ON public.message_reactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can access all reactions
CREATE POLICY "Service role can access all reactions" ON public.message_reactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 4: Create proper RLS policies for message_read_status table
-- ============================================================================

-- Users can view read status for accessible messages
CREATE POLICY "Users can view read status for accessible messages" ON public.message_read_status
  FOR SELECT TO authenticated
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

-- Users can manage their own read status
CREATE POLICY "Users can manage their own read status" ON public.message_read_status
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can access all read status
CREATE POLICY "Service role can access all read status" ON public.message_read_status
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 5: Ensure realtime publication includes all necessary columns
-- ============================================================================

-- Add messages table to realtime publication if not already there
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- Add message_reactions table to realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
    END IF;
END $$;

-- Add message_read_status table to realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_read_status'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_status;
    END IF;
END $$;

-- ============================================================================
-- PART 6: Grant necessary permissions for realtime to work
-- ============================================================================

-- Grant permissions on messages table
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

-- Grant permissions on message_reactions table
GRANT ALL ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

-- Grant permissions on message_read_status table
GRANT ALL ON public.message_read_status TO authenticated;
GRANT ALL ON public.message_read_status TO service_role;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- PART 7: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    messages_policy_count INTEGER;
    reactions_policy_count INTEGER;
    read_status_policy_count INTEGER;
    realtime_tables_count INTEGER;
    has_service_role_policies BOOLEAN;
BEGIN
    -- Check policy counts
    SELECT COUNT(*) INTO messages_policy_count
    FROM pg_policies 
    WHERE tablename = 'messages' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO reactions_policy_count
    FROM pg_policies 
    WHERE tablename = 'message_reactions' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO read_status_policy_count
    FROM pg_policies 
    WHERE tablename = 'message_read_status' AND schemaname = 'public';
    
    -- Check realtime tables
    SELECT COUNT(*) INTO realtime_tables_count
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename IN ('messages', 'message_reactions', 'message_read_status');
    
    -- Check if service role policies exist
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' 
        AND schemaname = 'public'
        AND roles @> '{service_role}'
    ) INTO has_service_role_policies;
    
    RAISE NOTICE '✅ Realtime RLS policies fixed successfully';
    RAISE NOTICE '  - Messages policies: %', messages_policy_count;
    RAISE NOTICE '  - Reactions policies: %', reactions_policy_count;
    RAISE NOTICE '  - Read status policies: %', read_status_policy_count;
    RAISE NOTICE '  - Realtime tables: %', realtime_tables_count;
    RAISE NOTICE '  - Service role policies exist: %', has_service_role_policies;
    RAISE NOTICE '  - Realtime messaging should now work correctly';
END $$; 