-- Migration: Fix VARCHAR/TEXT type mismatch in get_job_messages function
-- The function expects TEXT but some columns are VARCHAR

-- Update the get_job_messages function to handle actual column types correctly
CREATE OR REPLACE FUNCTION get_job_messages(
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
  FROM messages m
  LEFT JOIN profiles p ON m.user_id = p.id
  LEFT JOIN messages rm ON m.reply_to_id = rm.id
  LEFT JOIN profiles rp ON rm.user_id = rp.id
  WHERE m.job_id = p_job_id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) TO service_role;

-- Add comment
COMMENT ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) IS 'Get messages for a specific job with proper type casting for VARCHAR/TEXT compatibility'; 