-- Migration: Simplify notifications RLS policies for user-based access
-- This migration simplifies the notifications table RLS policies to allow users
-- to view any notification where their user_id matches, regardless of job permissions

-- Add missing fields to notifications table if they don't exist
-- These fields help link notifications to specific jobs/entities for future use
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Drop the existing restrictive policy that only allows users to view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view accessible notifications" ON notifications;

-- Create simple policy: Users can view any notification where their user_id matches
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update accessible notifications" ON notifications;

-- Create simple update policy: Users can update any notification where their user_id matches
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create a helper function to create notifications for all job participants
CREATE OR REPLACE FUNCTION create_notification_for_job_participants(
    p_job_id UUID,
    p_notification_type VARCHAR DEFAULT 'info',
    p_notification_category VARCHAR DEFAULT 'job',
    p_title VARCHAR DEFAULT '',
    p_message TEXT DEFAULT '',
    p_action_url VARCHAR DEFAULT NULL,
    p_action_text VARCHAR DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL,
    p_related_entity_type VARCHAR DEFAULT NULL,
    p_exclude_user_id UUID DEFAULT NULL -- User who performed the action (to exclude from notifications)
)
RETURNS INTEGER AS $$
DECLARE
    participant_record RECORD;
    notification_count INTEGER := 0;
    company_id_var UUID;
BEGIN
    -- Get the company_id for the job
    SELECT j.company_id INTO company_id_var
    FROM jobs j
    WHERE j.id = p_job_id;
    
    IF company_id_var IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Create notifications for all job participants (excluding the user who performed the action)
    FOR participant_record IN 
        SELECT DISTINCT jp.user_id
        FROM job_permissions jp
        WHERE jp.job_id = p_job_id
        AND (p_exclude_user_id IS NULL OR jp.user_id != p_exclude_user_id)
    LOOP
        INSERT INTO notifications (
            user_id,
            company_id,
            type,
            category,
            title,
            message,
            action_url,
            action_text,
            related_entity_id,
            related_entity_type
        ) VALUES (
            participant_record.user_id,
            company_id_var,
            p_notification_type,
            p_notification_category,
            p_title,
            p_message,
            p_action_url,
            p_action_text,
            p_related_entity_id,
            p_related_entity_type
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION create_notification_for_job_participants(UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, UUID, VARCHAR, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION create_notification_for_job_participants IS 'Creates notifications for all participants of a job, excluding the user who performed the action';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity (job, candidate, interview, contract, etc.)';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of the related entity (job, candidate, interview, contract, etc.)';

-- Update existing notification creation functions to populate the new fields
-- This will help ensure future notifications are properly linked to entities
