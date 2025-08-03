-- Migration: Remove all remaining user_activities functions and replace with notifications
-- This migration fixes all remaining references to the deprecated user_activities table

-- ============================================================================
-- PART 1: Drop all remaining triggers that reference user_activities
-- ============================================================================

DROP TRIGGER IF EXISTS trg_log_job_created ON public.jobs;
DROP TRIGGER IF EXISTS trg_log_candidate_applied ON public.candidates;
DROP TRIGGER IF EXISTS trg_log_evaluation_completed ON public.evaluations;
DROP TRIGGER IF EXISTS trg_log_interview_scheduled ON public.interviews;

-- ============================================================================
-- PART 2: Drop all remaining functions that reference user_activities
-- ============================================================================

DROP FUNCTION IF EXISTS log_job_created() CASCADE;
DROP FUNCTION IF EXISTS log_candidate_applied() CASCADE;
DROP FUNCTION IF EXISTS log_evaluation_completed() CASCADE;
DROP FUNCTION IF EXISTS log_interview_scheduled() CASCADE;

-- ============================================================================
-- PART 3: Create new notification functions for all events
-- ============================================================================

-- Function for candidate applications - sends notifications to all company users
CREATE OR REPLACE FUNCTION log_candidate_applied()
RETURNS TRIGGER AS $$
DECLARE
    job_company_id UUID;
    candidate_name TEXT;
    job_title TEXT;
BEGIN
    -- Get job details and company
    SELECT j.title, p.company_id 
    INTO job_title, job_company_id
    FROM public.jobs j
    JOIN public.profiles p ON j.profile_id = p.id
    WHERE j.id = NEW.job_id;
    
    -- Get candidate name
    candidate_name := NEW.first_name || ' ' || COALESCE(NEW.last_name, '');
    
    -- Create notifications for all users in the company
    INSERT INTO public.notifications (
        user_id,
        company_id,
        type,
        category,
        title,
        message,
        related_entity_type,
        related_entity_id,
        metadata
    )
    SELECT 
        p.id,
        job_company_id,
        'info',
        'candidate',
        'New Application Received',
        candidate_name || ' applied for "' || job_title || '"',
        'candidate',
        NEW.id,
        jsonb_build_object(
            'candidate_id', NEW.id,
            'candidate_name', candidate_name,
            'job_id', NEW.job_id,
            'job_title', job_title
        )
    FROM public.profiles p
    WHERE p.company_id = job_company_id
      AND p.id IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for evaluation completion - sends notifications to all company users
CREATE OR REPLACE FUNCTION log_evaluation_completed()
RETURNS TRIGGER AS $$
DECLARE
    evaluator_company_id UUID;
    candidate_name TEXT;
    evaluator_name TEXT;
BEGIN
    -- Get evaluator's company and name
    SELECT company_id, first_name || ' ' || COALESCE(last_name, '')
    INTO evaluator_company_id, evaluator_name
    FROM public.profiles 
    WHERE id = NEW.created_by;
    
    -- Get candidate name (assuming there's a candidates table with the candidate_id)
    SELECT first_name || ' ' || COALESCE(last_name, '')
    INTO candidate_name
    FROM public.candidates
    WHERE id = NEW.candidate_id;
    
    -- Create notifications for all users in the company
    INSERT INTO public.notifications (
        user_id,
        company_id,
        type,
        category,
        title,
        message,
        related_entity_type,
        related_entity_id,
        metadata
    )
    SELECT 
        p.id,
        evaluator_company_id,
        'success',
        'evaluation',
        'Evaluation Completed',
        evaluator_name || ' completed evaluation for ' || candidate_name,
        'evaluation',
        NEW.id,
        jsonb_build_object(
            'evaluation_id', NEW.id,
            'candidate_id', NEW.candidate_id,
            'candidate_name', candidate_name,
            'score', NEW.score,
            'recommendation', NEW.recommendation,
            'evaluator_name', evaluator_name
        )
    FROM public.profiles p
    WHERE p.company_id = evaluator_company_id
      AND p.id IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for interview scheduling - sends notifications to all company users
CREATE OR REPLACE FUNCTION log_interview_scheduled()
RETURNS TRIGGER AS $$
DECLARE
    scheduler_company_id UUID;
    candidate_name TEXT;
    scheduler_name TEXT;
    job_title TEXT;
BEGIN
    -- Get scheduler's company and name
    SELECT company_id, first_name || ' ' || COALESCE(last_name, '')
    INTO scheduler_company_id, scheduler_name
    FROM public.profiles 
    WHERE id = NEW.created_by;
    
    -- Get candidate and job details
    SELECT 
        c.first_name || ' ' || COALESCE(c.last_name, ''),
        j.title
    INTO candidate_name, job_title
    FROM public.candidates c
    JOIN public.jobs j ON c.job_id = j.id
    WHERE c.id = NEW.candidate_id;
    
    -- Create notifications for all users in the company
    INSERT INTO public.notifications (
        user_id,
        company_id,
        type,
        category,
        title,
        message,
        related_entity_type,
        related_entity_id,
        metadata
    )
    SELECT 
        p.id,
        scheduler_company_id,
        'info',
        'interview',
        'Interview Scheduled',
        'Interview scheduled for ' || candidate_name || ' (' || job_title || ')',
        'interview',
        NEW.id,
        jsonb_build_object(
            'interview_id', NEW.id,
            'candidate_id', NEW.candidate_id,
            'candidate_name', candidate_name,
            'job_title', job_title,
            'scheduled_by', scheduler_name,
            'interview_date', NEW.scheduled_at
        )
    FROM public.profiles p
    WHERE p.company_id = scheduler_company_id
      AND p.id IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Create triggers for the new notification functions
-- ============================================================================

-- Trigger for candidate applications
CREATE TRIGGER trg_log_candidate_applied
    AFTER INSERT ON public.candidates
    FOR EACH ROW EXECUTE FUNCTION log_candidate_applied();

-- Trigger for evaluation completion
CREATE TRIGGER trg_log_evaluation_completed
    AFTER INSERT ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION log_evaluation_completed();

-- Trigger for interview scheduling
CREATE TRIGGER trg_log_interview_scheduled
    AFTER INSERT ON public.interviews
    FOR EACH ROW EXECUTE FUNCTION log_interview_scheduled();

-- ============================================================================
-- PART 5: Grant permissions and add comments
-- ============================================================================

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_candidate_applied() TO service_role;
GRANT EXECUTE ON FUNCTION log_candidate_applied() TO postgres;
GRANT EXECUTE ON FUNCTION log_evaluation_completed() TO service_role;
GRANT EXECUTE ON FUNCTION log_evaluation_completed() TO postgres;
GRANT EXECUTE ON FUNCTION log_interview_scheduled() TO service_role;
GRANT EXECUTE ON FUNCTION log_interview_scheduled() TO postgres;

-- Add documentation comments
COMMENT ON FUNCTION log_candidate_applied() IS 'Creates notifications for all company users when a candidate applies';
COMMENT ON FUNCTION log_evaluation_completed() IS 'Creates notifications for all company users when an evaluation is completed';
COMMENT ON FUNCTION log_interview_scheduled() IS 'Creates notifications for all company users when an interview is scheduled';

-- Note: All activity logging now uses the notifications table exclusively
-- This ensures all company users are notified of important events 