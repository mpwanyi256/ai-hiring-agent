-- Migration: Fix notification triggers to notify job participants (not the actor)
-- This migration removes existing broken notification flows and implements the correct
-- job participant notification system that excludes the person who performed the action

-- STEP 1: Drop existing broken notification triggers
DROP TRIGGER IF EXISTS candidate_status_notification_trigger ON candidates;
DROP TRIGGER IF EXISTS contract_offer_notification_trigger ON contract_offers;
DROP TRIGGER IF EXISTS interview_notification_trigger ON interviews;
DROP TRIGGER IF EXISTS trg_candidate_status_change ON candidates;
DROP TRIGGER IF EXISTS trg_contract_offer_events ON contract_offers;
DROP TRIGGER IF EXISTS trg_interview_events ON interviews;

-- STEP 2: Create the missing create_notification_for_job_participants function
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
    p_exclude_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    participant_record RECORD;
    company_id_var uuid;
BEGIN
    -- Get company_id from the job
    SELECT company_id INTO company_id_var FROM jobs WHERE id = p_job_id;
    
    -- Create notifications for all job participants except the excluded user
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
                'related_entity_type', p_related_entity_type,
                'excluded_user_id', p_exclude_user_id
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Replace problematic create_activity_and_notification function
-- Remove notification creation (actors shouldn't get notifications for their own actions)
-- First drop the existing function to avoid parameter default conflicts
DROP FUNCTION IF EXISTS create_activity_and_notification;

CREATE FUNCTION create_activity_and_notification(
    p_user_id uuid,
    p_company_id uuid,
    p_activity_type varchar,
    p_entity_type varchar,
    p_entity_id uuid,
    p_title varchar,
    p_description text,
    p_activity_metadata jsonb,
    p_notification_type varchar DEFAULT NULL,
    p_notification_category varchar DEFAULT NULL,
    p_notification_message text DEFAULT NULL,
    p_action_url varchar DEFAULT NULL,
    p_action_text varchar DEFAULT NULL,
    p_notification_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    activity_id UUID;
BEGIN
    -- Create activity record only (no notification creation for actors)
    INSERT INTO user_activities (
        user_id, company_id, activity_type, entity_type, entity_id,
        title, description, metadata
    ) VALUES (
        p_user_id, p_company_id, p_activity_type, p_entity_type, p_entity_id,
        p_title, p_description, p_activity_metadata
    ) RETURNING id INTO activity_id;

    -- NOTE: No longer create notifications here - use create_notification_for_job_participants
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create working trigger functions for contract offers and interviews
-- (Skip candidate status for now since it lacks updated_by field)

-- Create contract offer events trigger function
CREATE OR REPLACE FUNCTION track_contract_offer_events()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    candidate_info RECORD;
    contract_info RECORD;
    activity_title TEXT;
    activity_desc TEXT;
    notification_msg TEXT;
    status_display TEXT;
BEGIN
    -- Get related information
    SELECT p.*, c.name as company_name 
    INTO user_profile
    FROM profiles p
    LEFT JOIN companies c ON c.id = p.company_id
    WHERE p.id = COALESCE(NEW.sent_by, NEW.updated_by);

    -- Get candidate information using the helper function
    SELECT * INTO candidate_info FROM get_candidate_info_for_notification(NEW.candidate_id);

    -- Get contract information
    SELECT title INTO contract_info
    FROM contracts
    WHERE id = NEW.contract_id;

    -- Handle new contract offers
    IF TG_OP = 'INSERT' THEN
        activity_title := 'Contract Offer Sent';
        activity_desc := format('Contract offer sent to %s %s for position: %s', 
            candidate_info.first_name, candidate_info.last_name, 
            COALESCE(contract_info.title, 'Unknown Position'));
        notification_msg := format('Contract offer sent to %s %s', 
            candidate_info.first_name, candidate_info.last_name);

        -- Create activity record for the person who sent the contract
        INSERT INTO user_activities (
            user_id, company_id, activity_type, entity_type, entity_id,
            title, description, metadata
        ) VALUES (
            NEW.sent_by,
            user_profile.company_id,
            'contract_sent',
            'contract_offer',
            NEW.id,
            activity_title,
            activity_desc,
            jsonb_build_object(
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'contract_id', NEW.contract_id,
                'contract_title', contract_info.title,
                'salary_amount', NEW.salary_amount,
                'salary_currency', NEW.salary_currency,
                'job_id', candidate_info.job_id
            )
        );

        -- Create notifications for all job participants (excluding the person who sent the contract)
        PERFORM create_notification_for_job_participants(
            p_job_id := candidate_info.job_id,
            p_notification_type := 'info',
            p_notification_category := 'contract',
            p_title := 'Contract Offer Sent',
            p_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', candidate_info.job_id, NEW.candidate_id),
            p_action_text := 'View Details',
            p_related_entity_id := NEW.id,
            p_related_entity_type := 'contract',
            p_exclude_user_id := NEW.sent_by
        );
    END IF;

    -- Handle status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        status_display := CASE 
            WHEN NEW.status = 'accepted' THEN 'accepted'
            WHEN NEW.status = 'rejected' THEN 'rejected'
            WHEN NEW.status = 'expired' THEN 'expired'
            ELSE NEW.status
        END;

        activity_title := format('Contract %s', INITCAP(status_display));
        activity_desc := format('Contract offer %s by %s %s', 
            status_display, candidate_info.first_name, candidate_info.last_name);
        notification_msg := format('%s %s %s the contract offer', 
            candidate_info.first_name, candidate_info.last_name, status_display);

        -- Create activity record
        INSERT INTO user_activities (
            user_id, company_id, activity_type, entity_type, entity_id,
            title, description, metadata
        ) VALUES (
            COALESCE(NEW.updated_by, NEW.sent_by),
            user_profile.company_id,
            format('contract_%s', NEW.status),
            'contract_offer',
            NEW.id,
            activity_title,
            activity_desc,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'contract_id', NEW.contract_id,
                'job_id', candidate_info.job_id
            )
        );

        -- Create notifications for all job participants (excluding the person who updated the status)
        PERFORM create_notification_for_job_participants(
            p_job_id := candidate_info.job_id,
            p_notification_type := CASE 
                WHEN NEW.status = 'accepted' THEN 'success'
                WHEN NEW.status = 'rejected' THEN 'warning'
                ELSE 'info'
            END,
            p_notification_category := 'contract',
            p_title := format('Contract %s', INITCAP(status_display)),
            p_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', candidate_info.job_id, NEW.candidate_id),
            p_action_text := 'View Details',
            p_related_entity_id := NEW.id,
            p_related_entity_type := 'contract',
            p_exclude_user_id := COALESCE(NEW.updated_by, NEW.sent_by)
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the interview events trigger function (if it exists)
CREATE OR REPLACE FUNCTION track_interview_events()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    candidate_info RECORD;
    activity_title TEXT;
    activity_desc TEXT;
    notification_msg TEXT;
    job_id_var UUID;
BEGIN
    -- Get user profile information
    SELECT p.*, c.name as company_name 
    INTO user_profile
    FROM profiles p
    LEFT JOIN companies c ON c.id = p.company_id
    WHERE p.id = COALESCE(NEW.created_by, NEW.updated_by);

    -- Get candidate and job information
    SELECT c.*, ci.first_name, ci.last_name, c.job_id
    INTO candidate_info
    FROM candidates c
    LEFT JOIN candidates_info ci ON ci.id = c.candidate_info_id
    WHERE c.id = NEW.candidate_id;

    job_id_var := candidate_info.job_id;

    -- Handle new interviews
    IF TG_OP = 'INSERT' THEN
        activity_title := 'Interview Scheduled';
        activity_desc := format('Interview scheduled with %s %s for %s', 
            candidate_info.first_name, candidate_info.last_name, 
            to_char(NEW.scheduled_at, 'YYYY-MM-DD HH24:MI'));
        notification_msg := format('Interview scheduled with %s %s', 
            candidate_info.first_name, candidate_info.last_name);

        -- Create activity record
        INSERT INTO user_activities (
            user_id, company_id, activity_type, entity_type, entity_id,
            title, description, metadata
        ) VALUES (
            NEW.created_by,
            user_profile.company_id,
            'interview_scheduled',
            'interview',
            NEW.id,
            activity_title,
            activity_desc,
            jsonb_build_object(
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'scheduled_at', NEW.scheduled_at,
                'job_id', job_id_var
            )
        );

        -- Create notifications for all job participants (excluding the person who scheduled the interview)
        PERFORM create_notification_for_job_participants(
            p_job_id := job_id_var,
            p_notification_type := 'info',
            p_notification_category := 'interview',
            p_title := 'Interview Scheduled',
            p_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', job_id_var, NEW.candidate_id),
            p_action_text := 'View Details',
            p_related_entity_id := NEW.id,
            p_related_entity_type := 'interview',
            p_exclude_user_id := NEW.created_by
        );
    END IF;

    -- Handle status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        activity_title := format('Interview %s', INITCAP(NEW.status));
        activity_desc := format('Interview %s for %s %s', 
            NEW.status, candidate_info.first_name, candidate_info.last_name);
        notification_msg := format('Interview %s for %s %s', 
            NEW.status, candidate_info.first_name, candidate_info.last_name);

        -- Create activity record
        INSERT INTO user_activities (
            user_id, company_id, activity_type, entity_type, entity_id,
            title, description, metadata
        ) VALUES (
            COALESCE(NEW.updated_by, NEW.created_by),
            user_profile.company_id,
            format('interview_%s', NEW.status),
            'interview',
            NEW.id,
            activity_title,
            activity_desc,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'job_id', job_id_var
            )
        );

        -- Create notifications for all job participants (excluding the person who updated the status)
        PERFORM create_notification_for_job_participants(
            p_job_id := job_id_var,
            p_notification_type := CASE 
                WHEN NEW.status = 'completed' THEN 'success'
                WHEN NEW.status = 'cancelled' THEN 'warning'
                ELSE 'info'
            END,
            p_notification_category := 'interview',
            p_title := format('Interview %s', INITCAP(NEW.status)),
            p_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', job_id_var, NEW.candidate_id),
            p_action_text := 'View Details',
            p_related_entity_id := NEW.id,
            p_related_entity_type := 'interview',
            p_exclude_user_id := COALESCE(NEW.updated_by, NEW.created_by)
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION track_contract_offer_events IS 'Trigger function that creates notifications for all job participants when contract offer events occur (excluding the person who performed the action)';
COMMENT ON FUNCTION track_interview_events IS 'Trigger function that creates notifications for all job participants when interview events occur (excluding the person who performed the action)';

-- STEP 4: Create the actual triggers that will use our corrected functions
-- These triggers will now properly notify job participants (excluding the actor)
-- Note: Skipping candidate status changes for now due to schema limitations

-- Create trigger for contract offer events
CREATE TRIGGER trg_contract_offer_events
    AFTER INSERT OR UPDATE ON contract_offers
    FOR EACH ROW
    EXECUTE FUNCTION track_contract_offer_events();

-- Create trigger for interview events
CREATE TRIGGER trg_interview_events
    AFTER INSERT OR UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION track_interview_events();

-- Add documentation
COMMENT ON TRIGGER trg_contract_offer_events ON contract_offers IS 'Notifies job participants when contract offers are sent or status changes (excludes the person who performed the action)';
COMMENT ON TRIGGER trg_interview_events ON interviews IS 'Notifies job participants when interviews are scheduled or status changes (excludes the person who performed the action)';

-- Summary of changes:
-- 1. Dropped existing broken notification triggers
-- 2. Modified create_activity_and_notification to only create activities (no notifications for actors)
-- 3. Created new trigger functions that use create_notification_for_job_participants
-- 4. Created new triggers that properly exclude the actor from notifications
-- Result: Job participants get notified of relevant events, but actors don't get self-notifications
