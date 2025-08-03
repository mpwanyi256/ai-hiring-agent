-- Migration: Fix notification function to notify ALL job participants (no exclusions)
-- The previous migration was excluding the actor, but we want ALL participants to be notified

-- Update the create_notification_for_job_participants function to notify ALL participants
CREATE OR REPLACE FUNCTION create_notification_for_job_participants(
    p_job_id uuid,
    p_notification_type varchar,
    p_notification_category varchar,
    p_title varchar,
    p_message text,
    p_action_url varchar DEFAULT NULL,
    p_action_text varchar DEFAULT NULL,
    p_related_entity_id uuid DEFAULT NULL,
    p_related_entity_type varchar DEFAULT NULL,
    p_exclude_user_id uuid DEFAULT NULL -- Keep parameter for backward compatibility but ignore it
)
RETURNS void AS $$
DECLARE
    participant_record RECORD;
    company_id_var uuid;
BEGIN
    -- Get company_id from the job
    SELECT company_id INTO company_id_var FROM jobs WHERE id = p_job_id;
    
    -- Create notifications for ALL job participants (no exclusions)
    FOR participant_record IN 
        SELECT DISTINCT jp.user_id
        FROM job_permissions jp
        WHERE jp.job_id = p_job_id
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
            metadata
        ) VALUES (
            participant_record.user_id,
            company_id_var,
            p_notification_type,
            p_notification_category,
            p_title,
            p_message,
            p_action_url,
            p_action_text,
            jsonb_build_object(
                'job_id', p_job_id,
                'related_entity_id', p_related_entity_id,
                'related_entity_type', p_related_entity_type
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION create_notification_for_job_participants IS 'Creates notifications for ALL job participants when recruitment events occur - no exclusions, everyone gets notified';
