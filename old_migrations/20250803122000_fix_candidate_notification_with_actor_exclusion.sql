-- Migration: Fix candidate notification with proper actor exclusion
-- Create a function that can be called directly from API with actor exclusion

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS candidate_status_notification_trigger ON candidates;

-- Create a function to handle candidate status notifications with actor exclusion
CREATE OR REPLACE FUNCTION handle_candidate_status_notification(
    p_candidate_id uuid,
    p_old_status candidate_status,
    p_new_status candidate_status,
    p_exclude_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    notification_title VARCHAR;
    notification_message TEXT;
    notification_type VARCHAR;
    action_url VARCHAR;
    old_status_display VARCHAR;
    new_status_display VARCHAR;
BEGIN
    -- Get candidate details
    SELECT c.*, j.id as job_id
    INTO candidate_record
    FROM candidates c
    JOIN jobs j ON c.job_id = j.id
    WHERE c.id = p_candidate_id;

    -- Get job details
    SELECT j.*, p.company_id, p.first_name || ' ' || p.last_name as recruiter_name
    INTO job_record
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = candidate_record.job_id;

    -- Skip if no records found
    IF job_record IS NULL THEN
        RETURN;
    END IF;

    -- Format status names for display
    old_status_display := REPLACE(INITCAP(REPLACE(p_old_status::text, '_', ' ')), 'Id', 'ID');
    new_status_display := REPLACE(INITCAP(REPLACE(p_new_status::text, '_', ' ')), 'Id', 'ID');

    -- Determine notification content based on new status
    CASE p_new_status
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
    notification_message := notification_message || ' has been updated from ' || old_status_display || ' to ' || new_status_display;

    -- Set action URL
    action_url := '/dashboard/jobs/' || job_record.id || '?candidate=' || p_candidate_id;

    -- Create notifications for job participants (excluding the actor if specified)
    PERFORM create_notification_for_job_participants(
        candidate_record.job_id,        -- p_job_id
        notification_type,             -- p_notification_type
        'candidate',                   -- p_notification_category
        notification_title,            -- p_title
        notification_message,          -- p_message
        action_url,                    -- p_action_url
        'View Candidate',              -- p_action_text
        p_candidate_id,                -- p_related_entity_id
        'candidate',                   -- p_related_entity_type
        p_exclude_user_id              -- p_exclude_user_id - exclude the actor
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to use the new function
CREATE OR REPLACE FUNCTION create_candidate_status_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Skip if status hasn't changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Call the notification function without actor exclusion (will be handled by API)
    PERFORM handle_candidate_status_notification(
        NEW.id,
        OLD.status,
        NEW.status
        -- No p_exclude_user_id - will be handled by API layer
    );

    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER candidate_status_notification_trigger
    AFTER UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION create_candidate_status_notification();

-- Add comments for documentation
COMMENT ON FUNCTION handle_candidate_status_notification IS 'Handles candidate status notifications with optional actor exclusion - can be called directly from API';
COMMENT ON FUNCTION create_candidate_status_notification IS 'Trigger function that creates notifications for job participants when candidate status changes';
COMMENT ON TRIGGER candidate_status_notification_trigger ON candidates IS 'Trigger that fires when candidate status is updated to notify job participants'; 