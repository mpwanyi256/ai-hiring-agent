-- Fix ambiguous column reference in mark_messages_as_read function
-- The issue is that "message_id" could refer to either the PL/pgSQL variable or the table column

DROP FUNCTION IF EXISTS mark_messages_as_read(UUID[], UUID);

-- Recreate function with proper variable naming to avoid ambiguity
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_message_ids UUID[],
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS INTEGER AS $$
DECLARE
    v_message_id UUID;  -- Renamed variable to avoid ambiguity
    v_total_inserted INTEGER := 0;
    v_rows_inserted INTEGER;
BEGIN
    FOREACH v_message_id IN ARRAY p_message_ids
    LOOP
        INSERT INTO message_read_status (message_id, user_id)
        VALUES (v_message_id, p_user_id)  -- Now clearly refers to the variable
        ON CONFLICT (message_id, user_id) DO NOTHING;
        
        GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;
        v_total_inserted := v_total_inserted + v_rows_inserted;
    END LOOP;
    
    RETURN v_total_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID[], UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION mark_messages_as_read(UUID[], UUID) IS 'Mark multiple messages as read by a user (fixed ambiguous column reference)'; 