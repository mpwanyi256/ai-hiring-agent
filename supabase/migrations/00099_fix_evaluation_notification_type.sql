-- Fix Evaluation Notification Type Migration
-- This migration fixes the notification type issue where evaluation notifications
-- were using 'evaluation' type which is not allowed by the notifications table constraint

-- ============================================================================
-- PART 1: Update the evaluation trigger function to use valid notification type
-- ============================================================================

-- Update the evaluation_notification trigger function to use 'application' type instead of 'evaluation'
CREATE OR REPLACE FUNCTION handle_evaluation_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title VARCHAR(255);
    notification_message TEXT;
    candidate_name VARCHAR(255);
    job_title VARCHAR(255);
BEGIN
    -- Get candidate and job details
    SELECT CONCAT(ci.first_name, ' ', ci.last_name), j.title
    INTO candidate_name, job_title
    FROM candidate_info ci
    JOIN candidates c ON c.candidate_info_id = ci.id
    JOIN jobs j ON j.id = NEW.job_id
    WHERE c.id = NEW.candidate_id;
    
    -- Set default if not found
    candidate_name := COALESCE(candidate_name, 'Unknown Candidate');
    job_title := COALESCE(job_title, 'Unknown Position');
    
    IF TG_OP = 'INSERT' THEN
        notification_title := 'New Evaluation Created';
        notification_message := 'A new evaluation has been created for ' || candidate_name || ' in ' || job_title;
    ELSE
        notification_title := 'Evaluation Updated';
        notification_message := 'The evaluation for ' || candidate_name || ' in ' || job_title || ' has been updated';
    END IF;
    
    -- Notify team members using 'application' type instead of 'evaluation'
    PERFORM notify_job_team_members(
        NEW.job_id,
        CASE WHEN TG_OP = 'INSERT' THEN 'evaluation_created' ELSE 'evaluation_updated' END,
        notification_title,
        notification_message,
        'application', -- Changed from 'evaluation' to 'application'
        NEW.id,
        NEW.candidate_id,
        json_build_object(
            'evaluator_id', NEW.profile_id,
            'score', NEW.score,
            'recommendation', NEW.recommendation
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Update the notify_job_team_members function to handle notification types properly
-- ============================================================================

-- Update the notify_job_team_members function to map notification types to valid constraint types
CREATE OR REPLACE FUNCTION notify_job_team_members(
    p_job_id UUID,
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_candidate_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_exclude_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    team_member RECORD;
    notification_type_mapped VARCHAR(50);
BEGIN
    -- Map notification types to valid constraint types
    notification_type_mapped := CASE 
        WHEN p_notification_type IN ('evaluation_created', 'evaluation_updated') THEN 'application'
        WHEN p_notification_type IN ('interview_created', 'interview_updated', 'interview_cancelled') THEN 'interview'
        WHEN p_notification_type IN ('candidate_applied', 'candidate_status_changed') THEN 'application'
        WHEN p_notification_type IN ('system_notification', 'system_update') THEN 'system'
        WHEN p_notification_type IN ('success_notification') THEN 'success'
        WHEN p_notification_type IN ('warning_notification') THEN 'warning'
        WHEN p_notification_type IN ('error_notification') THEN 'error'
        ELSE 'info' -- Default fallback
    END;

    -- Notify job owner
    INSERT INTO notifications (
        user_id, company_id, job_id, candidate_id, type, title, message, 
        category, entity_type, entity_id, related_entity_type, related_entity_id, metadata
    )
    SELECT 
        j.profile_id, 
        (SELECT company_id FROM profiles WHERE id = j.profile_id),
        p_job_id, 
        p_candidate_id, 
        notification_type_mapped, -- Use mapped type
        p_title, 
        p_message, 
        p_entity_type,
        p_entity_type,
        p_entity_id,
        p_entity_type,
        p_entity_id,
        p_metadata
    FROM jobs j
    WHERE j.id = p_job_id 
    AND j.profile_id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- Notify team members with permissions
    FOR team_member IN 
        SELECT DISTINCT jp.user_id
        FROM job_permissions jp
        WHERE jp.job_id = p_job_id
        AND jp.user_id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
        INSERT INTO notifications (
            user_id, company_id, job_id, candidate_id, type, title, message,
            category, entity_type, entity_id, related_entity_type, related_entity_id, metadata
        ) VALUES (
            team_member.user_id, 
            (SELECT company_id FROM profiles WHERE id = team_member.user_id),
            p_job_id, 
            p_candidate_id, 
            notification_type_mapped, -- Use mapped type
            p_title, 
            p_message,
            p_entity_type,
            p_entity_type,
            p_entity_id,
            p_entity_type,
            p_entity_id,
            p_metadata
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Grant permissions
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_evaluation_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_job_team_members(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, UUID, UUID, JSONB, UUID) TO authenticated;

-- ============================================================================
-- PART 4: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION handle_evaluation_notification() IS 'Trigger function to create notifications when evaluations are created or updated';
COMMENT ON FUNCTION notify_job_team_members(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, UUID, UUID, JSONB, UUID) IS 'Function to notify job team members with proper type mapping for notifications constraint'; 