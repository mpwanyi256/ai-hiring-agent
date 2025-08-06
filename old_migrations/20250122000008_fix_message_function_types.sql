-- Fix get_candidate_messages function to handle VARCHAR to TEXT type conversion

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS get_candidate_messages(UUID, UUID, INTEGER, INTEGER);

-- Drop the view first before recreating it with proper types
DROP VIEW IF EXISTS messages_detailed;

-- Recreate view with proper type casting
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

-- Recreate function with proper type casting
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_candidate_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_messages(UUID, UUID, INTEGER, INTEGER) TO service_role; 