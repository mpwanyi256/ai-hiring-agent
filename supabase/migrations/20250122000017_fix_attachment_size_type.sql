-- Migration: Fix attachment_size column type mismatch
-- The get_job_messages function expects BIGINT but the column might be INTEGER

-- Drop the view first since it depends on the column
DROP VIEW IF EXISTS messages_detailed;

-- First check the current column type and update if needed
DO $$
BEGIN
    -- Check if attachment_size is not already BIGINT
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'attachment_size' 
        AND data_type = 'integer'
    ) THEN
        -- Convert INTEGER to BIGINT
        ALTER TABLE messages ALTER COLUMN attachment_size TYPE BIGINT;
    END IF;
END $$;

-- Recreate the messages_detailed view
CREATE OR REPLACE VIEW messages_detailed AS
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
  
FROM messages m
LEFT JOIN profiles p ON m.user_id = p.id
LEFT JOIN jobs j ON m.job_id = j.id
LEFT JOIN messages rm ON m.reply_to_id = rm.id
LEFT JOIN profiles rp ON rm.user_id = rp.id;

-- Grant permissions for the recreated view
GRANT SELECT ON messages_detailed TO authenticated;
GRANT SELECT ON messages_detailed TO service_role;

-- Update the get_job_messages function to ensure proper type handling
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
    m.status,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.email as user_email,
    p.role as user_role,
    rm.text as reply_to_text,
    rp.first_name as reply_to_user_first_name,
    rp.last_name as reply_to_user_last_name
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
COMMENT ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) IS 'Get messages for a specific job with proper BIGINT type handling for attachment_size'; 