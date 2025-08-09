-- Fix contract offer notification trigger to handle anonymous candidate rejections
-- The issue: RLS recursion when accessing candidates table from trigger
-- Solution: Create security definer function to bypass RLS for safe data access

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_track_contract_offers ON contract_offers;
DROP FUNCTION IF EXISTS track_contract_offer_events();

-- Create security definer function to safely get candidate info without RLS recursion
CREATE OR REPLACE FUNCTION get_candidate_info_for_notification(candidate_id UUID)
RETURNS TABLE(first_name TEXT, last_name TEXT, job_id UUID) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ci.first_name, ci.last_name, c.job_id
    FROM candidates c
    JOIN candidates_info ci ON c.candidate_info_id = ci.id
    WHERE c.id = candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Create simplified trigger function that avoids RLS recursion
CREATE OR REPLACE FUNCTION track_contract_offer_events()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    candidate_info RECORD;
    contract_info RECORD;
    status_display VARCHAR;
    activity_title VARCHAR;
    activity_desc VARCHAR;
    notification_msg VARCHAR;
BEGIN
    -- Get user profile information for the contract sender
    SELECT p.*, c.name as company_name 
    INTO user_profile
    FROM profiles p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = NEW.sent_by;

    -- Skip if no user profile found (shouldn't happen for valid contracts)
    IF user_profile IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get candidate information using security definer function to avoid RLS recursion
    SELECT * INTO candidate_info FROM get_candidate_info_for_notification(NEW.candidate_id);

    -- Skip if no candidate information found
    IF candidate_info IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get contract information
    SELECT title INTO contract_info FROM contracts WHERE id = NEW.contract_id;

    -- Format status for display
    status_display := CASE NEW.status
        WHEN 'sent' THEN 'Sent'
        WHEN 'viewed' THEN 'Viewed'
        WHEN 'signed' THEN 'Signed'
        WHEN 'rejected' THEN 'Rejected'
        WHEN 'expired' THEN 'Expired'
        ELSE INITCAP(NEW.status)
    END;

    -- Handle new contract offers
    IF TG_OP = 'INSERT' THEN
        activity_title := 'Contract Offer Sent';
        activity_desc := format('Contract offer sent to %s %s for position: %s', 
            candidate_info.first_name, candidate_info.last_name, 
            COALESCE(contract_info.title, 'Unknown Position'));
        notification_msg := format('Contract offer sent to %s %s', 
            candidate_info.first_name, candidate_info.last_name);

        PERFORM create_activity_and_notification(
            p_user_id := NEW.sent_by,
            p_company_id := user_profile.company_id,
            p_activity_type := 'contract_sent',
            p_entity_type := 'contract_offer',
            p_entity_id := NEW.id,
            p_title := activity_title,
            p_description := activity_desc,
            p_activity_metadata := jsonb_build_object(
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'contract_id', NEW.contract_id,
                'contract_title', contract_info.title,
                'salary_amount', NEW.salary_amount,
                'salary_currency', NEW.salary_currency,
                'job_id', candidate_info.job_id
            ),
            p_notification_type := 'info',
            p_notification_category := 'contract',
            p_notification_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', candidate_info.job_id, NEW.candidate_id),
            p_action_text := 'View Details'
        );
    END IF;

    -- Handle status changes (including anonymous candidate actions)
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        activity_title := format('Contract %s', status_display);
        activity_desc := format('Contract offer %s by candidate %s %s', 
            LOWER(status_display), candidate_info.first_name, candidate_info.last_name);
        notification_msg := format('%s %s %s the contract offer', 
            candidate_info.first_name, candidate_info.last_name, LOWER(status_display));

        -- Create notification for the contract sender about the status change
        PERFORM create_activity_and_notification(
            p_user_id := NEW.sent_by,
            p_company_id := user_profile.company_id,
            p_activity_type := format('contract_%s', NEW.status),
            p_entity_type := 'contract_offer',
            p_entity_id := NEW.id,
            p_title := activity_title,
            p_description := activity_desc,
            p_activity_metadata := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'contract_id', NEW.contract_id,
                'contract_title', contract_info.title,
                'job_id', candidate_info.job_id,
                'rejection_reason', NEW.rejection_reason,
                'anonymous_action', NEW.status IN ('rejected', 'signed')
            ),
            p_notification_type := CASE 
                WHEN NEW.status = 'signed' THEN 'success'
                WHEN NEW.status IN ('rejected', 'expired') THEN 'warning'
                ELSE 'info'
            END,
            p_notification_category := 'contract',
            p_notification_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', candidate_info.job_id, NEW.candidate_id),
            p_action_text := 'View Details'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_track_contract_offers
    AFTER INSERT OR UPDATE ON contract_offers
    FOR EACH ROW
    EXECUTE FUNCTION track_contract_offer_events();

-- Make create_activity_and_notification function security definer to bypass RLS in triggers
-- This is needed because anonymous contract rejections don't have authenticated user context
ALTER FUNCTION create_activity_and_notification SECURITY DEFINER;

-- Add comments explaining the fix
COMMENT ON FUNCTION get_candidate_info_for_notification(UUID) IS 'Security definer function to safely get candidate info without RLS recursion in triggers';
COMMENT ON FUNCTION track_contract_offer_events() IS 'Handles contract offer events including anonymous operations like candidate rejections. Uses security definer function to avoid RLS recursion.';
COMMENT ON FUNCTION create_activity_and_notification IS 'Security definer function to allow triggers to create activities and notifications without authenticated user context.';
