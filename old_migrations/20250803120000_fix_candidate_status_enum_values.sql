-- Migration: Fix candidate status notification function to use correct enum values
-- The function was using 'interview_completed' which doesn't exist in candidate_status enum

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

    -- Create notifications for ALL job participants using our fixed function
    PERFORM create_notification_for_job_participants(
        NEW.job_id,                    -- p_job_id
        notification_type,             -- p_notification_type
        'candidate',                   -- p_notification_category
        notification_title,            -- p_title
        notification_message,          -- p_message
        action_url,                    -- p_action_url
        'View Candidate',              -- p_action_text
        NEW.id,                        -- p_related_entity_id
        'candidate'                    -- p_related_entity_type
        -- No p_exclude_user_id - notify ALL participants
    );

    RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION create_candidate_status_notification IS 'Trigger function that creates notifications for ALL job participants when candidate status changes - uses correct candidate_status enum values';
