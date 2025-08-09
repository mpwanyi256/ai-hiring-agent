-- Fix column order in get_candidate_messages function to match expected return type

-- Drop and recreate the function with correct column order
DROP FUNCTION IF EXISTS get_candidate_messages(UUID, UUID, INTEGER, INTEGER);

-- Recreate function with proper column order and types
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
        md.id,
        md.candidate_id,
        md.job_id,
        md.user_id,
        md.text,
        md.message_type,
        md.reply_to_id,
        md.thread_id,
        md.attachment_url,
        md.attachment_name,
        md.attachment_size,
        md.attachment_type,
        md.status,
        md.edited_at,
        md.created_at,
        md.updated_at,
        md.user_first_name,
        md.user_last_name,
        md.user_email,
        md.user_role,
        md.reply_to_text,
        md.reply_to_user_first_name,
        md.reply_to_user_last_name,
        -- Add reactions as JSON
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
        ) as reactions,
        md.is_read_by_current_user
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