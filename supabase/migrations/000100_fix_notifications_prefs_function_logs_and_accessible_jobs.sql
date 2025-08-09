-- Migration: Fix notifications preferences, candidate status notifications, function_logs constraint, and add get_user_accessible_jobs RPC

-- ============================================================================
-- PART 1: Add user_id to notification_preferences and keep it in sync
-- ============================================================================

DO $$
BEGIN
  -- Add user_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'notification_preferences' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN user_id UUID;

    -- Backfill from profile_id
    UPDATE public.notification_preferences SET user_id = profile_id WHERE user_id IS NULL;

    -- Enforce NOT NULL
    ALTER TABLE public.notification_preferences ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Ensure uniqueness on user_id (idempotent via pg_constraint check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conname = 'notification_prefs_user_id_key'
      AND c.conrelid = 'public.notification_preferences'::regclass
  ) THEN
    ALTER TABLE public.notification_preferences 
      ADD CONSTRAINT notification_prefs_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create trigger to keep user_id and profile_id in sync
CREATE OR REPLACE FUNCTION public.sync_notification_prefs_ids()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.profile_id IS NOT NULL THEN
    NEW.user_id := NEW.profile_id;
  ELSIF NEW.profile_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.profile_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_prefs_ids_ins ON public.notification_preferences;
DROP TRIGGER IF EXISTS trg_sync_notification_prefs_ids_upd ON public.notification_preferences;
CREATE TRIGGER trg_sync_notification_prefs_ids_ins
BEFORE INSERT ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.sync_notification_prefs_ids();
CREATE TRIGGER trg_sync_notification_prefs_ids_upd
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.sync_notification_prefs_ids();

-- ============================================================================
-- PART 2: Fix handle_candidate_status_notification to include company_id
-- ============================================================================

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
    company_id,
    job_id,
    candidate_id,
    type,
    title,
    message,
    category,
    entity_type,
    entity_id,
    related_entity_type,
    related_entity_id,
    action_url,
    action_text,
    is_read,
    metadata
  )
  SELECT DISTINCT 
    participants.u_id AS user_id,
    p.company_id,
    v_job_id,
    p_candidate_id,
    v_type,
    v_title,
    v_message,
    'candidate'::text,
    'candidate'::text,
    p_candidate_id,
    'candidate'::text,
    p_candidate_id,
    v_action_url,
    'View Candidate',
    false,
    '{}'::jsonb
  FROM (
    SELECT j.profile_id AS u_id
    FROM public.jobs j
    WHERE j.id = v_job_id
    UNION
    SELECT jp.user_id AS u_id
    FROM public.job_permissions jp
    WHERE jp.job_id = v_job_id
  ) participants
  JOIN public.profiles p ON p.id = participants.u_id
  WHERE (p_exclude_user_id IS NULL OR participants.u_id <> p_exclude_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_candidate_status_notification(uuid, public.candidate_status, public.candidate_status, uuid) TO authenticated;

-- ============================================================================
-- PART 3: Expand function_logs status constraint to include new statuses
-- ============================================================================

DO $$
BEGIN
  -- Drop existing constraint if present
  ALTER TABLE public.function_logs DROP CONSTRAINT IF EXISTS function_logs_status_check;
  -- Add new constraint including 'failed' and 'triggered'
  ALTER TABLE public.function_logs 
    ADD CONSTRAINT function_logs_status_check 
    CHECK (status IN ('pending', 'success', 'error', 'failed', 'triggered'));
END $$;

-- ============================================================================
-- PART 4: Add get_user_accessible_jobs RPC to avoid missing function errors
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_accessible_jobs(
  p_company_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_id UUID,
  permission_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.title, j.company_id,
         CASE 
           WHEN j.profile_id = p_user_id THEN 'owner'
           WHEN jp.permission_type IS NOT NULL THEN jp.permission_type
           ELSE 'view'
         END AS permission_type
  FROM public.jobs j
  LEFT JOIN public.job_permissions jp 
    ON jp.job_id = j.id AND jp.user_id = p_user_id
  WHERE j.company_id = p_company_id
    AND (j.profile_id = p_user_id OR jp.user_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_accessible_jobs(UUID, UUID) TO authenticated; 