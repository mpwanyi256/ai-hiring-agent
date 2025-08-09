-- Migration: Remove candidate_id from messages table to make it job-specific only
-- This simplifies the messaging system to be job-based rather than candidate-specific

-- First, let's backup any existing message data (optional, for safety)
CREATE TABLE IF NOT EXISTS messages_backup AS SELECT * FROM messages;

-- Drop the existing messages_detailed view first (it depends on candidate_id)
DROP VIEW IF EXISTS messages_detailed;

-- Drop existing functions that use candidate_id
DROP FUNCTION IF EXISTS get_candidate_messages(UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID[], UUID);
-- Drop any other possible versions of the function
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID[], UUID, UUID);
DROP FUNCTION IF EXISTS get_job_messages(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID);

-- Drop existing indexes that include candidate_id
DROP INDEX IF EXISTS idx_messages_candidate_id;
DROP INDEX IF EXISTS idx_messages_candidate_job;

-- Drop ALL possible existing RLS policies (both old and new names)
DROP POLICY IF EXISTS "Users can view messages for accessible candidates" ON messages;
DROP POLICY IF EXISTS "Users can send messages for accessible candidates" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages for accessible jobs" ON messages;
DROP POLICY IF EXISTS "Users can send messages for accessible jobs" ON messages;

-- Remove candidate_id column from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS candidate_id;

-- Update indexes to be job-based only
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_job_created ON messages(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_job ON messages(user_id, job_id);

-- Create new RLS policies based on job access only
CREATE POLICY "Users can view messages for accessible jobs" ON messages
  FOR SELECT USING (
    -- Job owner can view
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = messages.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR
    -- Users with job permissions can view
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = messages.job_id
      AND jp.user_id = auth.uid()
    )
    OR
    -- Admin users can view
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can send messages for accessible jobs" ON messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      -- Job owner can send
      EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = messages.job_id 
        AND jobs.profile_id = auth.uid()
      )
      OR
      -- Users with job permissions can send
      EXISTS (
        SELECT 1 FROM job_permissions jp
        WHERE jp.job_id = messages.job_id
        AND jp.user_id = auth.uid()
      )
      OR
      -- Admin users can send
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (user_id = auth.uid());

-- Create new function to get job messages (replacing get_candidate_messages)
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
    m.attachment_size,
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

-- Create new function to get unread message count for a job
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_job_id UUID,
  p_user_id UUID
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.job_id = p_job_id
    AND m.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_read_status mrs
      WHERE mrs.message_id = m.id
      AND mrs.user_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the mark_messages_as_read function to work with job-based messages
CREATE OR REPLACE FUNCTION mark_messages_as_read(
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
    INSERT INTO message_read_status (message_id, user_id, read_at)
    VALUES (msg_id, p_user_id, NOW())
    ON CONFLICT (message_id, user_id) DO NOTHING;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    marked_count := marked_count + rows_affected;
  END LOOP;
  
  RETURN marked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID[], UUID) TO service_role;

-- Recreate messages_detailed view to remove candidate references
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

-- Grant permissions for the updated view
GRANT SELECT ON messages_detailed TO authenticated;
GRANT SELECT ON messages_detailed TO service_role;

-- Add comments
COMMENT ON FUNCTION get_job_messages(UUID, INTEGER, INTEGER) IS 'Get messages for a specific job with user details';
COMMENT ON FUNCTION get_unread_message_count(UUID, UUID) IS 'Get count of unread messages for a user in a specific job';
COMMENT ON TABLE messages IS 'Job-based team discussion messages'; 