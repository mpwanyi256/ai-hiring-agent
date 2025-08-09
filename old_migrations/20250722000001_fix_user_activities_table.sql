-- DROP policy Authenticated users can read all activities
DROP POLICY IF EXISTS "Authenticated users can read all activities" ON public.user_activities;

-- 1. Enable RLS on user_activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- 2. Allow all authenticated users to SELECT from user_activities
CREATE POLICY "Authenticated users can read all activities"
  ON public.user_activities
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Update log_interview_scheduled() to use SECURITY DEFINER and set search_path
CREATE OR REPLACE FUNCTION public.log_interview_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = 'public';
  INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
  VALUES (
    NEW.created_by,
    'interview_scheduled',
    NEW.id,
    'interview',
    'Interview scheduled',
    jsonb_build_object('candidate_id', NEW.application_id, 'job_id', NEW.job_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Repeat the SECURITY DEFINER and search_path fix for your other trigger functions (log_candidate_applied, log_job_created, log_evaluation_completed) as well.

CREATE OR REPLACE FUNCTION log_candidate_applied()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = 'public';
  INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
  VALUES (
    NEW.created_by, -- assumes candidates.created_by is the user_id
    'candidate_applied',
    NEW.id,
    'candidate',
    'New candidate applied',
    jsonb_build_object('candidate_name', NEW.first_name || ' ' || NEW.last_name, 'job_id', NEW.job_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_job_created()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = 'public';
  INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
  VALUES (
    NEW.created_by, -- assumes jobs.created_by is the user_id
    'job_created',
    NEW.id,
    'job',
    'New job posted',
    jsonb_build_object('job_title', NEW.title)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_evaluation_completed()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = 'public';
  INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
  VALUES (
    NEW.created_by, -- assumes evaluations.created_by is the user_id
    'evaluation_completed',
    NEW.id,
    'evaluation',
    'Evaluation completed',
    jsonb_build_object('candidate_id', NEW.candidate_id, 'score', NEW.score, 'recommendation', NEW.recommendation)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

