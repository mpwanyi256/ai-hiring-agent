-- Migration: Fix duplicate notification triggers and add duplicate prevention
-- This migration ensures only one trigger exists and adds logic to prevent duplicate notifications

-- STEP 1: Drop all existing notification triggers to start fresh
DROP TRIGGER IF EXISTS candidate_status_notification_trigger ON candidates;
DROP TRIGGER IF EXISTS contract_offer_notification_trigger ON contract_offers;
DROP TRIGGER IF EXISTS interview_notification_trigger ON interviews;
DROP TRIGGER IF EXISTS trg_candidate_status_change ON candidates;
DROP TRIGGER IF EXISTS trg_contract_offer_events ON contract_offers;
DROP TRIGGER IF EXISTS trg_interview_events ON interviews;

-- STEP 2: Create a function to check for recent duplicate notifications
CREATE OR REPLACE FUNCTION check_recent_notification_exists(
    p_user_id uuid,
    p_job_id uuid,
    p_related_entity_id uuid,
    p_related_entity_type varchar,
    p_title varchar,
    p_time_window_minutes integer DEFAULT 5
)
RETURNS boolean AS $$
DECLARE
    recent_notification_count integer;
BEGIN
    -- Check if a similar notification was created recently for the same user and entity
    SELECT COUNT(*) INTO recent_notification_count
    FROM notifications
    WHERE user_id = p_user_id
      AND metadata->>'job_id' = p_job_id::text
      AND metadata->>'related_entity_id' = p_related_entity_id::text
      AND metadata->>'related_entity_type' = p_related_entity_type
      AND title = p_title
      AND created_at > NOW() - INTERVAL '1 minute' * p_time_window_minutes;
    
    RETURN recent_notification_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Update the create_notification_for_job_participants function to prevent duplicates
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
    -- Get company_id from the job through profiles table (jobs.profile_id -> profiles.company_id)
    SELECT p.company_id INTO company_id_var 
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = p_job_id;
    
    -- Skip if no company_id found
    IF company_id_var IS NULL THEN
        RETURN;
    END IF;
    
    -- Create notifications for job participants (excluding the actor if specified)
    FOR participant_record IN 
        SELECT DISTINCT jp.user_id
        FROM job_permissions jp
        WHERE jp.job_id = p_job_id
        AND (p_exclude_user_id IS NULL OR jp.user_id != p_exclude_user_id)
    LOOP
        -- Check for recent duplicate notification before creating new one
        IF NOT check_recent_notification_exists(
            participant_record.user_id,
            p_job_id,
            p_related_entity_id,
            p_related_entity_type,
            p_title,
            5 -- 5 minute window
        ) THEN
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
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create the final candidate status notification function
CREATE OR REPLACE FUNCTION create_candidate_status_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    notification_title VARCHAR;
    notification_message TEXT;
    notification_type VARCHAR;
    action_url VARCHAR;
    old_status VARCHAR;
    new_status VARCHAR;
BEGIN
    -- Skip if status hasn't changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get job details
    SELECT j.*, p.company_id, p.first_name || ' ' || p.last_name as recruiter_name
    INTO job_record
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = NEW.job_id;

    -- Get candidate details from candidates_info
    SELECT ci.first_name, ci.last_name
    INTO candidate_record
    FROM candidates_info ci
    WHERE ci.id = NEW.candidate_info_id;

    -- Skip if no records found
    IF job_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Format status names for display
    old_status := REPLACE(INITCAP(REPLACE(OLD.status::text, '_', ' ')), 'Id', 'ID');
    new_status := REPLACE(INITCAP(REPLACE(NEW.status::text, '_', ' ')), 'Id', 'ID');

    -- Determine notification content based on new status (using correct enum values)
    CASE NEW.status
        WHEN 'under_review' THEN
            notification_title := 'Under Review';
            notification_type := 'info';
        WHEN 'interview_scheduled' THEN
            notification_title := 'Interview Scheduled';
            notification_type := 'info';
        WHEN 'shortlisted' THEN
            notification_title := 'Candidate Shortlisted';
            notification_type := 'success';
        WHEN 'reference_check' THEN
            notification_title := 'Reference Check';
            notification_type := 'info';
        WHEN 'offer_extended' THEN
            notification_title := 'Offer Extended';
            notification_type := 'success';
        WHEN 'offer_accepted' THEN
            notification_title := 'Offer Accepted';
            notification_type := 'success';
        WHEN 'hired' THEN
            notification_title := 'Candidate Hired';
            notification_type := 'success';
        WHEN 'rejected' THEN
            notification_title := 'Candidate Rejected';
            notification_type := 'error';
        WHEN 'withdrawn' THEN
            notification_title := 'Candidate Withdrawn';
            notification_type := 'warning';
        ELSE
            notification_title := 'Candidate Status Updated';
            notification_type := 'info';
    END CASE;

    -- Build notification message
    notification_message := 'Candidate ';
    IF candidate_record.first_name IS NOT NULL THEN
        notification_message := notification_message || candidate_record.first_name || ' ' || COALESCE(candidate_record.last_name, '');
    ELSE
        notification_message := notification_message || 'status';
    END IF;
    notification_message := notification_message || ' has been updated from ' || old_status || ' to ' || new_status;

    -- Set action URL
    action_url := '/dashboard/jobs/' || job_record.id || '?candidate=' || NEW.id;

    -- Create notifications for job participants (excluding the actor)
    PERFORM create_notification_for_job_participants(
        NEW.job_id,                    -- p_job_id
        notification_type,             -- p_notification_type
        'candidate',                   -- p_notification_category
        notification_title,            -- p_title
        notification_message,          -- p_message
        action_url,                    -- p_action_url
        'View Candidate',              -- p_action_text
        NEW.id,                        -- p_related_entity_id
        'candidate',                   -- p_related_entity_type
        NEW.user_id                    -- p_exclude_user_id - exclude the actor
    );

    RETURN NEW;
END;
$function$;

-- STEP 5: Create the single trigger for candidate status changes
CREATE TRIGGER candidate_status_notification_trigger
    AFTER UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION create_candidate_status_notification();

-- STEP 6: Add comments for documentation
COMMENT ON FUNCTION check_recent_notification_exists IS 'Checks if a similar notification was created recently to prevent duplicates';
COMMENT ON FUNCTION create_notification_for_job_participants IS 'Creates notifications for job participants with duplicate prevention - excludes the actor who performed the action';
COMMENT ON FUNCTION create_candidate_status_notification IS 'Trigger function that creates notifications for job participants when candidate status changes - includes duplicate prevention';
COMMENT ON TRIGGER candidate_status_notification_trigger ON candidates IS 'Single trigger that fires when candidate status is updated to notify job participants (excluding the actor)'; 