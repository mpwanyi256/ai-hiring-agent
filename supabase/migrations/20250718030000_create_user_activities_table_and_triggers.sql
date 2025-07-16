-- Create user_activities table for audit logging
CREATE TABLE public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,           -- The user who performed the action
  event_type text NOT NULL,        -- e.g. 'candidate_applied', 'interview_scheduled'
  entity_id uuid,                  -- e.g. candidate, job, interview, etc.
  entity_type text,                -- e.g. 'candidate', 'job', 'interview'
  message text,                    -- Human-readable description
  meta jsonb,                      -- Optional: extra data (e.g. job title, candidate name)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activities_user_created_at ON public.user_activities (user_id, created_at DESC);

-- Trigger function for logging candidate applications
CREATE OR REPLACE FUNCTION log_candidate_applied()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = '';
  INSERT INTO user_activities (user_id, event_type, entity_id, entity_type, message, meta)
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_candidate_applied
AFTER INSERT ON candidates
FOR EACH ROW EXECUTE FUNCTION log_candidate_applied();

-- Trigger function for logging interview scheduled
CREATE OR REPLACE FUNCTION log_interview_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = '';
  INSERT INTO user_activities (user_id, event_type, entity_id, entity_type, message, meta)
  VALUES (
    NEW.created_by, -- assumes interviews.created_by is the user_id
    'interview_scheduled',
    NEW.id,
    'interview',
    'Interview scheduled',
    jsonb_build_object('candidate_id', NEW.application_id, 'job_id', NEW.job_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_interview_scheduled
AFTER INSERT ON interviews
FOR EACH ROW EXECUTE FUNCTION log_interview_scheduled();

-- Trigger function for logging job created
CREATE OR REPLACE FUNCTION log_job_created()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = '';
  INSERT INTO user_activities (user_id, event_type, entity_id, entity_type, message, meta)
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_job_created
AFTER INSERT ON jobs
FOR EACH ROW EXECUTE FUNCTION log_job_created();

-- Trigger function for logging evaluation completed
CREATE OR REPLACE FUNCTION log_evaluation_completed()
RETURNS TRIGGER AS $$
BEGIN
  set search_path = '';
  INSERT INTO user_activities (user_id, event_type, entity_id, entity_type, message, meta)
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_evaluation_completed
AFTER INSERT ON evaluations
FOR EACH ROW EXECUTE FUNCTION log_evaluation_completed(); 