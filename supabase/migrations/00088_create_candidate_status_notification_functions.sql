-- Migration: Create candidate status notification functions and trigger

-- Create or replace function that can be called directly (supports actor exclusion)
CREATE OR REPLACE FUNCTION public.handle_candidate_status_notification(
  p_candidate_id uuid,
  p_old_status public.candidate_status,
  p_new_status public.candidate_status,
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id uuid;
  v_candidate_first text;
  v_candidate_last text;
  v_title text;
  v_message text;
  v_type text;
  v_action_url text;
BEGIN
  -- Get candidate's job and name
  SELECT c.job_id, ci.first_name, ci.last_name
  INTO v_job_id, v_candidate_first, v_candidate_last
  FROM public.candidates c
  LEFT JOIN public.candidates_info ci ON ci.id = c.candidate_info_id
  WHERE c.id = p_candidate_id;

  IF v_job_id IS NULL THEN
    RETURN; -- nothing to do
  END IF;

  -- Title/type based on new status
  CASE p_new_status
    WHEN 'under_review' THEN v_title := 'Under Review'; v_type := 'info';
    WHEN 'interview_scheduled' THEN v_title := 'Interview Scheduled'; v_type := 'info';
    WHEN 'shortlisted' THEN v_title := 'Candidate Shortlisted'; v_type := 'success';
    WHEN 'reference_check' THEN v_title := 'Reference Check'; v_type := 'info';
    WHEN 'offer_extended' THEN v_title := 'Offer Extended'; v_type := 'success';
    WHEN 'offer_accepted' THEN v_title := 'Offer Accepted'; v_type := 'success';
    WHEN 'hired' THEN v_title := 'Candidate Hired'; v_type := 'success';
    WHEN 'rejected' THEN v_title := 'Candidate Rejected'; v_type := 'error';
    WHEN 'withdrawn' THEN v_title := 'Candidate Withdrawn'; v_type := 'warning';
    ELSE v_title := 'Candidate Status Updated'; v_type := 'info';
  END CASE;

  -- Build message and action URL
  v_message := 'Candidate ' || COALESCE(TRIM(v_candidate_first || ' ' || COALESCE(v_candidate_last, '')), 'status') ||
               ' has been updated from ' || REPLACE(INITCAP(REPLACE(p_old_status::text, '_', ' ')), 'Id', 'ID') ||
               ' to ' || REPLACE(INITCAP(REPLACE(p_new_status::text, '_', ' ')), 'Id', 'ID');
  v_action_url := '/dashboard/jobs/' || v_job_id || '?candidate=' || p_candidate_id;

  -- Notify all job participants (job owner + job_permissions users), excluding the actor if provided
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    action_url,
    is_read,
    category,
    action_text,
    related_entity_id,
    related_entity_type,
    job_id,
    candidate_id
  )
  SELECT DISTINCT u_id, v_title, v_message, v_type, v_action_url, false, 'candidate', 'View Candidate',
         p_candidate_id, 'candidate', v_job_id, p_candidate_id
  FROM (
    SELECT j.profile_id AS u_id
    FROM public.jobs j
    WHERE j.id = v_job_id
    UNION
    SELECT jp.user_id AS u_id
    FROM public.job_permissions jp
    WHERE jp.job_id = v_job_id
  ) participants
  WHERE (p_exclude_user_id IS NULL OR participants.u_id <> p_exclude_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_candidate_status_notification(uuid, public.candidate_status, public.candidate_status, uuid) TO authenticated;

-- Trigger function to automatically generate notifications on status change
CREATE OR REPLACE FUNCTION public.create_candidate_status_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.handle_candidate_status_notification(NEW.id, OLD.status, NEW.status, NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS candidate_status_notification_trigger ON public.candidates;
CREATE TRIGGER candidate_status_notification_trigger
AFTER UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.create_candidate_status_notification();

COMMENT ON FUNCTION public.handle_candidate_status_notification IS 'Notifies all job participants when candidate status changes; supports actor exclusion';
COMMENT ON FUNCTION public.create_candidate_status_notification IS 'Trigger to notify participants on candidate status updates';
COMMENT ON TRIGGER candidate_status_notification_trigger ON public.candidates IS 'Fires on update to create candidate status notifications'; 