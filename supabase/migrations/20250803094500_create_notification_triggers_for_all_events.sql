-- Migration: Create notification triggers for all events
-- Description: Set up triggers to automatically create notification records for contract offers, interviews, and other events
-- This eliminates the need for synthetic notifications by ensuring all events are stored in the notifications table

-- Function to create contract offer notifications
CREATE OR REPLACE FUNCTION create_contract_offer_notification()
RETURNS TRIGGER AS $$
DECLARE
    contract_record RECORD;
    candidate_record RECORD;
    job_participant RECORD;
    notification_title VARCHAR;
    notification_message TEXT;
    notification_type VARCHAR;
    action_url VARCHAR;
BEGIN
    -- Get contract details
    SELECT c.*, p.company_id, p.first_name || ' ' || p.last_name as sender_name
    INTO contract_record
    FROM contracts c
    JOIN profiles p ON c.created_by = p.id
    WHERE c.id = NEW.contract_id;

    -- Get candidate details
    SELECT cd.*, ci.first_name, ci.last_name
    INTO candidate_record
    FROM candidate_details cd
    LEFT JOIN candidates_info ci ON cd.id = ci.candidate_id
    WHERE cd.id = NEW.candidate_id;

    -- Skip if no records found
    IF contract_record IS NULL OR candidate_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Determine notification content based on status
    CASE NEW.status
        WHEN 'sent' THEN
            notification_title := 'Contract Sent';
            notification_message := 'Contract "' || COALESCE(contract_record.title, 'Untitled') || '" has been sent to ' || 
                                  COALESCE(candidate_record.first_name || ' ' || candidate_record.last_name, 'candidate');
            notification_type := 'info';
        WHEN 'signed' THEN
            notification_title := 'Contract Signed';
            notification_message := 'Contract "' || COALESCE(contract_record.title, 'Untitled') || '" has been signed by ' || 
                                  COALESCE(candidate_record.first_name || ' ' || candidate_record.last_name, 'candidate');
            notification_type := 'success';
        WHEN 'rejected' THEN
            notification_title := 'Contract Rejected';
            notification_message := 'Contract "' || COALESCE(contract_record.title, 'Untitled') || '" has been rejected by ' || 
                                  COALESCE(candidate_record.first_name || ' ' || candidate_record.last_name, 'candidate');
            IF NEW.rejection_reason IS NOT NULL THEN
                notification_message := notification_message || '. Reason: ' || NEW.rejection_reason;
            END IF;
            notification_type := 'error';
        WHEN 'cancelled' THEN
            notification_title := 'Contract Cancelled';
            notification_message := 'Contract "' || COALESCE(contract_record.title, 'Untitled') || '" has been cancelled';
            notification_type := 'warning';
        ELSE
            notification_title := 'Contract Updated';
            notification_message := 'Contract "' || COALESCE(contract_record.title, 'Untitled') || '" status has been updated to ' || NEW.status;
            notification_type := 'info';
    END CASE;

    -- Set action URL
    action_url := '/dashboard/contracts/' || contract_record.id;

    -- Create notifications for all job participants
    FOR job_participant IN
        SELECT DISTINCT jp.user_id, p.company_id
        FROM job_permissions jp
        JOIN profiles p ON jp.user_id = p.id
        WHERE jp.job_id = candidate_record.job_id
          AND p.company_id = contract_record.company_id
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
            metadata,
            created_at
        ) VALUES (
            job_participant.user_id,
            contract_record.company_id,
            notification_type,
            'contract_offer',
            notification_title,
            notification_message,
            action_url,
            'View Contract',
            jsonb_build_object(
                'contract_offer_id', NEW.id,
                'contract_id', NEW.contract_id,
                'candidate_id', NEW.candidate_id,
                'status', NEW.status,
                'rejection_reason', NEW.rejection_reason,
                'entity_id', NEW.id::text,
                'entity_type', 'contract_offer'
            ),
            NOW()
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create interview notifications
CREATE OR REPLACE FUNCTION create_interview_notification()
RETURNS TRIGGER AS $$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    job_participant RECORD;
    notification_title VARCHAR;
    notification_message TEXT;
    notification_type VARCHAR;
    action_url VARCHAR;
BEGIN
    -- Get job and user details
    SELECT j.*, p.company_id, p.first_name || ' ' || p.last_name as interviewer_name
    INTO job_record
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = NEW.job_id;

    -- Get candidate details
    SELECT cd.*, ci.first_name, ci.last_name
    INTO candidate_record
    FROM candidate_details cd
    LEFT JOIN candidates_info ci ON cd.id = ci.candidate_id
    WHERE cd.id = NEW.application_id;

    -- Skip if no records found
    IF job_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Determine notification content based on status
    CASE NEW.status
        WHEN 'scheduled' THEN
            notification_title := 'Interview Scheduled';
            notification_message := 'Interview scheduled for ' || NEW.date || ' at ' || NEW.time;
            IF candidate_record.first_name IS NOT NULL THEN
                notification_message := notification_message || ' with ' || candidate_record.first_name || ' ' || COALESCE(candidate_record.last_name, '');
            END IF;
            notification_type := 'info';
        WHEN 'completed' THEN
            notification_title := 'Interview Completed';
            notification_message := 'Interview has been completed';
            IF candidate_record.first_name IS NOT NULL THEN
                notification_message := notification_message || ' with ' || candidate_record.first_name || ' ' || COALESCE(candidate_record.last_name, '');
            END IF;
            notification_type := 'success';
        WHEN 'cancelled' THEN
            notification_title := 'Interview Cancelled';
            notification_message := 'Interview scheduled for ' || NEW.date || ' at ' || NEW.time || ' has been cancelled';
            notification_type := 'error';
        WHEN 'rescheduled' THEN
            notification_title := 'Interview Rescheduled';
            notification_message := 'Interview has been rescheduled to ' || NEW.date || ' at ' || NEW.time;
            notification_type := 'warning';
        ELSE
            notification_title := 'Interview Updated';
            notification_message := 'Interview status has been updated to ' || NEW.status;
            notification_type := 'info';
    END CASE;

    -- Set action URL
    action_url := '/dashboard/jobs/' || job_record.id;

    -- Create notifications for all job participants
    FOR job_participant IN
        SELECT DISTINCT jp.user_id, p.company_id
        FROM job_permissions jp
        JOIN profiles p ON jp.user_id = p.id
        WHERE jp.job_id = NEW.job_id
          AND p.company_id = job_record.company_id
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
            metadata,
            created_at
        ) VALUES (
            job_participant.user_id,
            job_record.company_id,
            notification_type,
            'interview',
            notification_title,
            notification_message,
            action_url,
            'View Job',
            jsonb_build_object(
                'interview_id', NEW.id,
                'job_id', NEW.job_id,
                'candidate_id', NEW.application_id,
                'date', NEW.date,
                'time', NEW.time,
                'status', NEW.status,
                'entity_id', NEW.id::text,
                'entity_type', 'interview'
            ),
            NOW()
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create candidate status change notifications
CREATE OR REPLACE FUNCTION create_candidate_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    job_participant RECORD;
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

    -- Determine notification content based on new status
    CASE NEW.status
        WHEN 'shortlisted' THEN
            notification_title := 'Candidate Shortlisted';
            notification_type := 'success';
        WHEN 'interview_scheduled' THEN
            notification_title := 'Interview Scheduled';
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

    -- Create notifications for all job participants
    FOR job_participant IN
        SELECT DISTINCT jp.user_id, p.company_id
        FROM job_permissions jp
        JOIN profiles p ON jp.user_id = p.id
        WHERE jp.job_id = NEW.job_id
          AND p.company_id = job_record.company_id
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
            metadata,
            created_at
        ) VALUES (
            job_participant.user_id,
            job_record.company_id,
            notification_type,
            'candidate',
            notification_title,
            notification_message,
            action_url,
            'View Candidate',
            jsonb_build_object(
                'candidate_id', NEW.id,
                'job_id', NEW.job_id,
                'old_status', OLD.status::text,
                'new_status', NEW.status::text,
                'entity_id', NEW.id::text,
                'entity_type', 'candidate'
            ),
            NOW()
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for contract offers
DROP TRIGGER IF EXISTS trigger_contract_offer_notification ON contract_offers;
CREATE TRIGGER trigger_contract_offer_notification
    AFTER INSERT OR UPDATE OF status ON contract_offers
    FOR EACH ROW
    EXECUTE FUNCTION create_contract_offer_notification();

-- Create triggers for interviews
DROP TRIGGER IF EXISTS trigger_interview_notification ON interviews;
CREATE TRIGGER trigger_interview_notification
    AFTER INSERT OR UPDATE OF status ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION create_interview_notification();

-- Create triggers for candidate status changes
DROP TRIGGER IF EXISTS trigger_candidate_status_notification ON candidates;
CREATE TRIGGER trigger_candidate_status_notification
    AFTER UPDATE OF status ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION create_candidate_status_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_contract_offer_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_interview_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_candidate_status_notification() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION create_contract_offer_notification() IS 'Creates notification records when contract offers are created or updated';
COMMENT ON FUNCTION create_interview_notification() IS 'Creates notification records when interviews are scheduled, completed, or cancelled';
COMMENT ON FUNCTION create_candidate_status_notification() IS 'Creates notification records when candidate status changes';

-- Update the notifications_details view to only use real notifications
DROP VIEW IF EXISTS notifications_details;
CREATE OR REPLACE VIEW notifications_details AS
SELECT 
  n.id::text AS id,
  n.type,
  n.title,
  n.message,
  n.created_at AS timestamp,
  CASE 
    WHEN n.type = 'success' THEN 'success'
    WHEN n.type = 'error' THEN 'error'
    WHEN n.type = 'warning' THEN 'warning'
    ELSE 'info'
  END AS status,
  n.is_read AS read,
  n.user_id,
  n.company_id,
  n.metadata,
  n.category AS entity_type,
  COALESCE(n.metadata->>'entity_id', '') AS entity_id,
  n.action_url,
  n.action_text,
  n.read_at,
  n.expires_at,
  n.id AS notification_id
FROM notifications n
WHERE n.expires_at IS NULL OR n.expires_at > NOW()
ORDER BY n.created_at DESC;

-- Add security invoker and permissions
ALTER VIEW public.notifications_details SET (security_invoker = on);
GRANT SELECT ON public.notifications_details TO authenticated;

-- Add comments
COMMENT ON VIEW notifications_details IS 'Unified view of all notifications from the notifications table - no more synthetic notifications needed';
COMMENT ON COLUMN notifications_details.notification_id IS 'The actual notification record ID that can be used for updates';
