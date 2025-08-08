-- Migration: Fix interview notification function to bypass RLS with SECURITY DEFINER
-- The function needs SECURITY DEFINER to insert notifications during interview creation

-- Drop and recreate the interview notification function with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.create_interview_notification() CASCADE;

CREATE OR REPLACE FUNCTION public.create_interview_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    creator_record RECORD;
    notification_title VARCHAR;
    notification_message TEXT;
    action_url VARCHAR;
BEGIN
    -- Get job details
    SELECT j.* INTO job_record
    FROM public.jobs j
    WHERE j.id = NEW.job_id;

    -- Get candidate details from candidates and candidates_info
    SELECT c.*, ci.first_name, ci.last_name
    INTO candidate_record
    FROM public.candidates c
    LEFT JOIN public.candidates_info ci ON ci.id = c.candidate_info_id
    WHERE c.id = NEW.application_id;

    -- Get creator (current user) details
    SELECT p.first_name, p.last_name
    INTO creator_record
    FROM public.profiles p
    WHERE p.id = auth.uid();

    -- Skip if no records found
    IF job_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Only create notification for INSERT (new events)
    IF TG_OP = 'INSERT' THEN
        -- Create notification content
        notification_title := 'New Event Created';
        notification_message := 'An event was created for ' || 
                               COALESCE(candidate_record.first_name || ' ' || COALESCE(candidate_record.last_name, ''), 'candidate') || 
                               ' by ' ||
                               COALESCE(creator_record.first_name || ' ' || COALESCE(creator_record.last_name, ''), 'User');
        action_url := '/dashboard/jobs/' || job_record.id;

        -- Create notifications for all job participants (job owner + team members)
        INSERT INTO public.notifications (
            user_id, 
            title, 
            message, 
            type, 
            action_url,
            is_read,
            job_id,
            candidate_id,
            related_entity_id,
            related_entity_type
        )
        SELECT DISTINCT
            participant_user_id,
            notification_title, 
            notification_message, 
            'interview', 
            action_url,
            false,
            job_record.id,
            NEW.application_id,
            NEW.id,
            'interview'
        FROM (
            -- Job owner
            SELECT job_record.profile_id AS participant_user_id
            UNION
            -- Team members with job permissions
            SELECT jp.user_id AS participant_user_id
            FROM public.job_permissions jp
            WHERE jp.job_id = job_record.id
        ) all_participants
        WHERE participant_user_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_interview_notification ON public.interviews;
CREATE TRIGGER trigger_interview_notification
    AFTER INSERT OR UPDATE OF status ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.create_interview_notification();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_interview_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_interview_notification() TO service_role;

COMMENT ON FUNCTION public.create_interview_notification() IS 
'Creates notification records when events are created - notifies all job participants and uses SECURITY DEFINER to bypass RLS'; 