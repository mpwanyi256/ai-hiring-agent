-- 00154_fix_interview_and_contract_notifications.sql
-- Ensure real notifications are created for interviews and contract offers
-- 1) Add interview_id into notification metadata and include company_id
-- 2) Create notifications on contract offer status updates (not only insert)
-- 3) Resolve job_id for contract offers from candidates when not present on the row

SET search_path = public;

-- 1) Recreate interview notification function to include metadata and company_id
DROP FUNCTION IF EXISTS public.create_interview_notification() CASCADE;

CREATE OR REPLACE FUNCTION public.create_interview_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    creator_record RECORD;
    v_company_id UUID;
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

    -- Resolve company from job owner profile
    SELECT p.company_id INTO v_company_id
    FROM public.profiles p
    WHERE p.id = job_record.profile_id;

    -- Get creator (current user) details
    SELECT p.first_name, p.last_name
    INTO creator_record
    FROM public.profiles p
    WHERE p.id = auth.uid();

    IF job_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Create on insert and status update
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
        notification_title := CASE NEW.status
            WHEN 'completed' THEN 'Interview Completed'
            WHEN 'cancelled' THEN 'Interview Cancelled'
            WHEN 'scheduled' THEN 'Interview Scheduled'
            ELSE 'New Event Created'
        END;

        notification_message := CASE NEW.status
            WHEN 'scheduled' THEN 'Interview scheduled for ' || NEW.date || ' at ' || NEW.time
            WHEN 'completed' THEN 'Interview has been completed'
            WHEN 'cancelled' THEN 'Interview has been cancelled'
            ELSE 'An event was created for ' || 
                 COALESCE(candidate_record.first_name || ' ' || COALESCE(candidate_record.last_name, ''), 'candidate') ||
                 ' by ' || COALESCE(creator_record.first_name || ' ' || COALESCE(creator_record.last_name, ''), 'User')
        END;

        action_url := '/dashboard/jobs/' || job_record.id;

        INSERT INTO public.notifications (
            user_id,
            company_id,
            title,
            message,
            type,
            action_url,
            is_read,
            job_id,
            candidate_id,
            related_entity_id,
            related_entity_type,
            metadata
        )
        SELECT DISTINCT
            participant_user_id,
            v_company_id,
            notification_title,
            notification_message,
            'interview',
            action_url,
            false,
            job_record.id,
            NEW.application_id,
            NEW.id,
            'interview',
            jsonb_build_object(
                'interview_id', NEW.id,
                'date', NEW.date,
                'time', NEW.time,
                'status', NEW.status,
                'job_id', NEW.job_id,
                'candidate_id', NEW.application_id,
                'entity_id', NEW.id::text
            )
        FROM (
            SELECT job_record.profile_id AS participant_user_id
            UNION
            SELECT jp.user_id AS participant_user_id
            FROM public.job_permissions jp
            WHERE jp.job_id = job_record.id
        ) participants
        WHERE participant_user_id IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_interview_notification ON public.interviews;
CREATE TRIGGER trigger_interview_notification
    AFTER INSERT OR UPDATE OF status ON public.interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.create_interview_notification();

GRANT EXECUTE ON FUNCTION public.create_interview_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_interview_notification() TO service_role;

-- 2) Update contract offer notification function to also fire on status updates and resolve job_id reliably
DROP FUNCTION IF EXISTS public.notify_job_members_on_contract_offer() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_job_members_on_contract_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_contract_title TEXT;
  v_job_id UUID;
BEGIN
  SELECT c.company_id, c.title INTO v_company_id, v_contract_title
  FROM public.contracts c
  WHERE c.id = NEW.contract_id;

  -- Resolve job id: prefer NEW.job_id, fallback via candidate
  BEGIN
    SELECT NEW.job_id INTO v_job_id; -- if column exists
  EXCEPTION WHEN undefined_column THEN
    v_job_id := NULL;
  END;

  IF v_job_id IS NULL AND NEW.candidate_id IS NOT NULL THEN
    SELECT cand.job_id INTO v_job_id
    FROM public.candidates cand
    WHERE cand.id = NEW.candidate_id;
  END IF;

  IF v_job_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, company_id, type, title, message, metadata)
    SELECT jp.user_id, v_company_id, 'contract_offer',
           CASE 
             WHEN NEW.status = 'signed' THEN 'Contract Signed'
             WHEN NEW.status = 'rejected' THEN 'Contract Rejected'
             WHEN NEW.status = 'sent' THEN 'Contract Sent'
             ELSE 'Contract Updated'
           END,
           CASE 
             WHEN NEW.status = 'signed' THEN 'Contract has been signed for ' || COALESCE(v_contract_title, 'position')
             WHEN NEW.status = 'rejected' THEN 'Contract has been rejected' || 
                  CASE WHEN NEW.rejection_reason IS NOT NULL THEN ': ' || NEW.rejection_reason ELSE '' END
             WHEN NEW.status = 'sent' THEN 'Contract sent for ' || COALESCE(v_contract_title, 'position')
             ELSE 'Contract status updated'
           END,
           jsonb_build_object(
             'contract_offer_id', NEW.id,
             'contract_id', NEW.contract_id,
             'candidate_id', NEW.candidate_id,
             'status', NEW.status,
             'job_id', v_job_id,
             'entity_id', NEW.id::text
           )
    FROM public.job_permissions jp
    WHERE jp.job_id = v_job_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_job_members_on_contract_offer ON public.contract_offers;
CREATE TRIGGER trg_notify_job_members_on_contract_offer
AFTER INSERT OR UPDATE OF status ON public.contract_offers
FOR EACH ROW EXECUTE FUNCTION public.notify_job_members_on_contract_offer();

GRANT EXECUTE ON FUNCTION public.notify_job_members_on_contract_offer() TO authenticated;


