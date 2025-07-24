-- Migration: Create messaging system for candidate collaboration
-- This allows team members to chat about candidates in real-time

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Message content
    text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    
    -- Threading support
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    thread_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- Root message of thread
    
    -- File attachments (optional)
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    attachment_type TEXT,
    
    -- Message status
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'deleted')),
    edited_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for better performance
    CONSTRAINT messages_text_length CHECK (char_length(text) <= 2000)
);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique reaction per user per message per emoji
    UNIQUE(message_id, user_id, emoji)
);

-- Create message read status table
CREATE TABLE IF NOT EXISTS public.message_read_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique read status per user per message
    UNIQUE(message_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_candidate_job ON public.messages(candidate_id, job_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message ON public.message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user ON public.message_read_status(user_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
-- Users can view messages for jobs they have access to
CREATE POLICY "Users can view messages for accessible jobs" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_permissions jp
            WHERE jp.job_id = messages.job_id
            AND jp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM jobs j, profiles p
            WHERE j.id = messages.job_id
            AND j.profile_id = auth.uid()
            OR (p.id = auth.uid() AND p.role = 'admin')
        )
    );

-- Users can insert messages for jobs they have access to
CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        (
            EXISTS (
                SELECT 1 FROM job_permissions jp
                WHERE jp.job_id = messages.job_id
                AND jp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM jobs j, profiles p
                WHERE j.id = messages.job_id
                AND j.profile_id = auth.uid()
                OR (p.id = auth.uid() AND p.role = 'admin')
            )
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for message reactions
CREATE POLICY "Users can view reactions for accessible messages" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_reactions.message_id
            AND (
                EXISTS (
                    SELECT 1 FROM job_permissions jp
                    WHERE jp.job_id = m.job_id
                    AND jp.user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM jobs j, profiles p
                    WHERE j.id = m.job_id
                    AND j.profile_id = auth.uid()
                    OR (p.id = auth.uid() AND p.role = 'admin')
                )
            )
        )
    );

CREATE POLICY "Users can manage their own reactions" ON public.message_reactions
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for message read status
CREATE POLICY "Users can view read status for accessible messages" ON public.message_read_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_read_status.message_id
            AND (
                EXISTS (
                    SELECT 1 FROM job_permissions jp
                    WHERE jp.job_id = m.job_id
                    AND jp.user_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM jobs j, profiles p
                    WHERE j.id = m.job_id
                    AND j.profile_id = auth.uid()
                    OR (p.id = auth.uid() AND p.role = 'admin')
                )
            )
        )
    );

CREATE POLICY "Users can manage their own read status" ON public.message_read_status
    FOR ALL USING (user_id = auth.uid());

-- Add updated_at trigger for messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for messages with basic details (without reactions for now)
CREATE OR REPLACE VIEW messages_detailed AS
SELECT 
    m.id,
    m.candidate_id,
    m.job_id,
    m.user_id,
    m.text,
    m.message_type,
    m.reply_to_id,
    m.thread_id,
    m.attachment_url,
    m.attachment_name,
    m.attachment_size,
    m.attachment_type,
    m.status,
    m.edited_at,
    m.created_at,
    m.updated_at,
    
    -- User details (cast VARCHAR to TEXT)
    p.first_name::TEXT as user_first_name,
    p.last_name::TEXT as user_last_name,
    p.email::TEXT as user_email,
    p.role::TEXT as user_role,
    
    -- Reply to message details (cast VARCHAR to TEXT)
    rm.text as reply_to_text,
    rp.first_name::TEXT as reply_to_user_first_name,
    rp.last_name::TEXT as reply_to_user_last_name,
    
    -- Read status
    CASE WHEN mrs.read_at IS NOT NULL THEN true ELSE false END as is_read_by_current_user
    
FROM public.messages m
LEFT JOIN public.profiles p ON m.user_id = p.id
LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
LEFT JOIN public.profiles rp ON rm.user_id = rp.id
LEFT JOIN public.message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = auth.uid();

-- Grant permissions for the view
GRANT SELECT ON public.messages_detailed TO authenticated;
GRANT SELECT ON public.messages_detailed TO service_role;

-- Create function to get messages for a candidate discussion
CREATE OR REPLACE FUNCTION get_candidate_messages(
    p_candidate_id UUID,
    p_job_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    candidate_id UUID,
    job_id UUID,
    user_id UUID,
    text TEXT,
    message_type TEXT,
    reply_to_id UUID,
    thread_id UUID,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    attachment_type TEXT,
    status TEXT,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_first_name TEXT,
    user_last_name TEXT,
    user_email TEXT,
    user_role TEXT,
    reply_to_text TEXT,
    reply_to_user_first_name TEXT,
    reply_to_user_last_name TEXT,
    reactions JSON,
    is_read_by_current_user BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        md.*,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'emoji', emoji_data.emoji,
                        'count', emoji_data.reaction_count,
                        'users', emoji_data.user_names
                    )
                )
                FROM (
                    SELECT 
                        mr.emoji,
                        COUNT(*) as reaction_count,
                        array_agg(COALESCE(pr.first_name::TEXT || ' ' || pr.last_name::TEXT, pr.email::TEXT)) as user_names
                    FROM message_reactions mr
                    LEFT JOIN profiles pr ON mr.user_id = pr.id
                    WHERE mr.message_id = md.id
                    GROUP BY mr.emoji
                ) emoji_data
            ),
            '[]'::json
        ) as reactions
    FROM messages_detailed md
    WHERE md.candidate_id = p_candidate_id 
    AND md.job_id = p_job_id
    ORDER BY md.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_message_ids UUID[],
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
    message_id UUID;
    total_inserted INTEGER := 0;
    rows_inserted INTEGER;
BEGIN
    FOREACH message_id IN ARRAY p_message_ids
    LOOP
        INSERT INTO message_read_status (message_id, user_id)
        VALUES (message_id, p_user_id)
        ON CONFLICT (message_id, user_id) DO NOTHING;
        
        GET DIAGNOSTICS rows_inserted = ROW_COUNT;
        total_inserted := total_inserted + rows_inserted;
    END LOOP;
    
    RETURN total_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(
    p_candidate_id UUID,
    p_job_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM messages m
        WHERE m.candidate_id = p_candidate_id
        AND m.job_id = p_job_id
        AND m.user_id != p_user_id
        AND NOT EXISTS (
            SELECT 1 FROM message_read_status mrs
            WHERE mrs.message_id = m.id
            AND mrs.user_id = p_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_candidate_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_messages(UUID, UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID[], UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID, UUID, UUID) TO service_role;

-- Add comments
COMMENT ON TABLE public.messages IS 'Chat messages for candidate discussions';
COMMENT ON TABLE public.message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE public.message_read_status IS 'Track which messages have been read by which users';
COMMENT ON FUNCTION get_candidate_messages(UUID, UUID, INTEGER, INTEGER) IS 'Get paginated messages for a candidate discussion';
COMMENT ON FUNCTION mark_messages_as_read(UUID[], UUID) IS 'Mark multiple messages as read by a user';
COMMENT ON FUNCTION get_unread_message_count(UUID, UUID, UUID) IS 'Get count of unread messages for a user in a candidate discussion'; 