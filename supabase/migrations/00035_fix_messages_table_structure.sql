-- Fix Messages Table Structure Migration
-- This migration adds missing columns to the messages table based on original old migrations

-- ============================================================================
-- PART 1: Add missing columns to messages table
-- ============================================================================

-- Add text column (original message content column)
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN text TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add reply_to_id column for threading support
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add thread_id column for threading support
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN thread_id UUID REFERENCES public.messages(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add attachment_url column
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add attachment_name column
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN attachment_name TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add attachment_size column
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN attachment_size INTEGER;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add attachment_type column
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN attachment_type TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add status column
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'deleted'));
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add edited_at column
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add user_id column (alias for sender_id for compatibility)
DO $$ BEGIN
    ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- ============================================================================
-- PART 2: Create missing indexes
-- ============================================================================

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_candidate_job ON public.messages(candidate_id, job_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- ============================================================================
-- PART 3: Add constraints
-- ============================================================================

-- Add text length constraint
DO $$ BEGIN
    ALTER TABLE public.messages ADD CONSTRAINT messages_text_length CHECK (char_length(text) <= 2000);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add message_type check constraint
DO $$ BEGIN
    ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'file', 'system'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- PART 4: Create message_reactions table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- ============================================================================
-- PART 5: Create message_read_status table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- ============================================================================
-- PART 6: Create indexes for related tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message ON public.message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user ON public.message_read_status(user_id);

-- ============================================================================
-- PART 7: Enable RLS and create policies
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create RLS policies for messages
CREATE POLICY "Users can view messages for accessible jobs" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.job_permissions jp
            WHERE jp.job_id = messages.job_id
            AND jp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.jobs j, public.profiles p
            WHERE j.id = messages.job_id
            AND j.profile_id = auth.uid()
            OR (p.id = auth.uid() AND p.role = 'admin')
        )
    );

CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
    FOR INSERT WITH CHECK (
        (user_id = auth.uid() OR sender_id = auth.uid()) AND
        (
            EXISTS (
                SELECT 1 FROM public.job_permissions jp
                WHERE jp.job_id = messages.job_id
                AND jp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.jobs j, public.profiles p
                WHERE j.id = messages.job_id
                AND j.profile_id = auth.uid()
                OR (p.id = auth.uid() AND p.role = 'admin')
            )
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (user_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (user_id = auth.uid() OR sender_id = auth.uid());

-- RLS policies for message_reactions
CREATE POLICY "Users can view reactions for accessible messages" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_reactions.message_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.job_permissions jp
                    WHERE jp.job_id = m.job_id
                    AND jp.user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.jobs j, public.profiles p
                    WHERE j.id = m.job_id
                    AND j.profile_id = auth.uid()
                    OR (p.id = auth.uid() AND p.role = 'admin')
                )
            )
        )
    );

CREATE POLICY "Users can manage their own reactions" ON public.message_reactions
    FOR ALL USING (user_id = auth.uid());

-- RLS policies for message_read_status
CREATE POLICY "Users can view read status for accessible messages" ON public.message_read_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_read_status.message_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.job_permissions jp
                    WHERE jp.job_id = m.job_id
                    AND jp.user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.jobs j, public.profiles p
                    WHERE j.id = m.job_id
                    AND j.profile_id = auth.uid()
                    OR (p.id = auth.uid() AND p.role = 'admin')
                )
            )
        )
    );

CREATE POLICY "Users can manage their own read status" ON public.message_read_status
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- PART 8: Add updated_at trigger for messages
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;

-- Create trigger for messages updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 9: Grant permissions
-- ============================================================================

-- Grant permissions on tables
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_read_status TO authenticated;

-- ============================================================================
-- PART 10: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.messages IS 'Chat messages for candidate discussions';
COMMENT ON COLUMN public.messages.text IS 'Original message content (legacy column)';
COMMENT ON COLUMN public.messages.content IS 'Current message content';
COMMENT ON COLUMN public.messages.user_id IS 'User ID (alias for sender_id for compatibility)';
COMMENT ON COLUMN public.messages.sender_id IS 'Sender ID (current column)';
COMMENT ON COLUMN public.messages.reply_to_id IS 'ID of message this is replying to';
COMMENT ON COLUMN public.messages.thread_id IS 'ID of root message in thread';
COMMENT ON COLUMN public.messages.attachment_url IS 'URL of attached file';
COMMENT ON COLUMN public.messages.attachment_name IS 'Name of attached file';
COMMENT ON COLUMN public.messages.attachment_size IS 'Size of attached file in bytes';
COMMENT ON COLUMN public.messages.attachment_type IS 'MIME type of attached file';
COMMENT ON COLUMN public.messages.status IS 'Message status: sent, delivered, read, deleted';
COMMENT ON COLUMN public.messages.edited_at IS 'When the message was last edited';

COMMENT ON TABLE public.message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE public.message_read_status IS 'Track which messages have been read by which users';

-- ============================================================================
-- PART 11: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    table_exists BOOLEAN;
BEGIN
    -- Check column count
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND table_schema = 'public';
    
    -- Check index count
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'messages' AND schemaname = 'public';
    
    -- Check if message_reactions table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'message_reactions' 
        AND table_schema = 'public'
    ) INTO table_exists;
    
    RAISE NOTICE '✅ Messages table structure fixed successfully';
    RAISE NOTICE '  - Column count: %', column_count;
    RAISE NOTICE '  - Index count: %', index_count;
    RAISE NOTICE '  - Message reactions table exists: %', table_exists;
    RAISE NOTICE '  - Message sending should now work correctly';
END $$; 