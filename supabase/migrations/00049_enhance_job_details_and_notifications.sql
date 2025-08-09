-- Enhance Job Details and Notifications Migration
-- This migration enhances job views with missing details and creates notification functions for job activities

-- ============================================================================
-- PART 1: Enhance jobs_comprehensive view with missing salary and department details
-- ============================================================================

DROP VIEW IF EXISTS public.jobs_comprehensive CASCADE;

CREATE OR REPLACE VIEW public.jobs_comprehensive AS
SELECT 
    j.id,
    j.profile_id,
    j.title,
    j.description,
    j.requirements,
    j.location,
    j.salary_range,
    j.employment_type,
    j.status,
    j.fields,
    j.settings,
    j.interview_format,
    j.interview_token,
    j.is_active,
    j.created_at,
    j.updated_at,
    j.department_id,
    j.job_title_id,
    j.employment_type_id,
    j.workplace_type,
    j.job_type,
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    j.salary_period,
    
    -- Creator/Profile details
    jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'firstName', p.first_name,
        'lastName', p.last_name,
        'role', p.role,
        'avatarUrl', p.avatar_url
    ) as creator_details,
    
    -- Company details
    p.company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.logo_url as company_logo_url,
    c.website as company_website,
    c.industry as company_industry,
    c.size_range as company_size,
    
    -- Department details
    d.name as department_name,
    
    -- Job title details
    jt.name as job_title_name,
    
    -- Employment type details
    et.name as employment_type_name,
    
    -- Statistics
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
    COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews,
    COALESCE(candidate_stats.response_count, 0) as response_count,
    COALESCE(candidate_stats.evaluation_count, 0) as evaluation_count,
    COALESCE(candidate_stats.average_score, 0) as average_score

FROM jobs j
LEFT JOIN profiles p ON j.profile_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN departments d ON j.department_id = d.id
LEFT JOIN job_titles jt ON j.job_title_id = jt.id
LEFT JOIN employment_types et ON j.employment_type_id = et.id
LEFT JOIN (
    SELECT 
        cand.job_id,
        COUNT(DISTINCT cand.id) as candidate_count,
        COUNT(DISTINCT CASE WHEN cand.is_completed = true THEN cand.id END) as completed_interviews,
        COUNT(DISTINCT r.id) as response_count,
        COUNT(DISTINCT e.id) as evaluation_count,
        ROUND(AVG(CASE WHEN e.score > 0 THEN e.score END), 2) as average_score
    FROM candidates cand
    LEFT JOIN responses r ON cand.id = r.candidate_id
    LEFT JOIN evaluations e ON cand.id = e.candidate_id AND cand.job_id = e.job_id
    GROUP BY cand.job_id
) candidate_stats ON j.id = candidate_stats.job_id;

-- ============================================================================
-- PART 2: Create notification functions for job activities
-- ============================================================================

-- Function to get all users with permissions on a job
CREATE OR REPLACE FUNCTION get_job_participants(p_job_id UUID)
RETURNS TABLE(user_id UUID, permission_level TEXT, company_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.user_id,
        jp.permission_level,
        p.company_id
    FROM job_permissions jp
    JOIN profiles p ON jp.user_id = p.id
    WHERE jp.job_id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for job participants
CREATE OR REPLACE FUNCTION create_job_notification(
    p_job_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_category TEXT DEFAULT 'job',
    p_action_url TEXT DEFAULT NULL,
    p_action_text TEXT DEFAULT NULL,
    p_exclude_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    participant RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Get all participants for the job
    FOR participant IN 
        SELECT * FROM get_job_participants(p_job_id)
    LOOP
        -- Skip if this is the user who triggered the action
        IF participant.user_id = p_exclude_user_id THEN
            CONTINUE;
        END IF;
        
        -- Create notification for each participant
        INSERT INTO notifications (
            user_id,
            company_id,
            title,
            message,
            type,
            category,
            action_url,
            action_text,
            metadata,
            related_entity_id,
            related_entity_type
        ) VALUES (
            participant.user_id,
            participant.company_id,
            p_title,
            p_message,
            p_type,
            p_category,
            p_action_url,
            p_action_text,
            p_metadata,
            p_job_id,
            'job'
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: Create triggers for job-related notifications
-- ============================================================================

-- Trigger function for new candidate applications
CREATE OR REPLACE FUNCTION notify_new_candidate_application()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    candidate_name TEXT;
    candidate_email TEXT;
BEGIN
    -- Get job and candidate details
    SELECT j.title INTO job_title 
    FROM jobs j WHERE j.id = NEW.job_id;
    
    SELECT 
        COALESCE(ci.first_name || ' ' || ci.last_name, ci.email) as name,
        ci.email
    INTO candidate_name, candidate_email
    FROM candidates_info ci 
    WHERE ci.id = NEW.candidate_info_id;
    
    -- Create notification for job participants
    PERFORM create_job_notification(
        NEW.job_id,
        'New Job Application',
        format('A new candidate (%s) has applied for the position: %s', 
               COALESCE(candidate_name, candidate_email), job_title),
        'info',
        'application',
        format('/dashboard/jobs/%s', NEW.job_id),
        'View Application',
        NULL, -- Don't exclude anyone
        jsonb_build_object(
            'candidate_id', NEW.id,
            'candidate_email', candidate_email,
            'job_title', job_title
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new candidate applications
DROP TRIGGER IF EXISTS trigger_notify_new_candidate_application ON candidates;
CREATE TRIGGER trigger_notify_new_candidate_application
    AFTER INSERT ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_candidate_application();

-- Trigger function for resume evaluation completion
CREATE OR REPLACE FUNCTION notify_resume_evaluation_complete()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    candidate_name TEXT;
    candidate_email TEXT;
    evaluation_score NUMERIC;
    evaluation_recommendation TEXT;
BEGIN
    -- Only trigger for resume evaluations
    IF NEW.evaluation_type != 'resume' THEN
        RETURN NEW;
    END IF;
    
    -- Get job and candidate details
    SELECT j.title INTO job_title 
    FROM jobs j WHERE j.id = NEW.job_id;
    
    SELECT 
        COALESCE(ci.first_name || ' ' || ci.last_name, ci.email) as name,
        ci.email
    INTO candidate_name, candidate_email
    FROM candidates c
    JOIN candidates_info ci ON c.candidate_info_id = ci.id
    WHERE c.id = NEW.candidate_id;
    
    evaluation_score := COALESCE(NEW.resume_score, NEW.score);
    evaluation_recommendation := NEW.recommendation;
    
    -- Create notification for job participants
    PERFORM create_job_notification(
        NEW.job_id,
        'Resume Evaluation Complete',
        format('Resume evaluation completed for %s applying to %s. Score: %s%%, Recommendation: %s', 
               COALESCE(candidate_name, candidate_email), 
               job_title,
               ROUND(evaluation_score),
               CASE 
                   WHEN evaluation_recommendation = 'yes' THEN 'Proceed'
                   WHEN evaluation_recommendation = 'no' THEN 'Reject'
                   ELSE evaluation_recommendation
               END),
        CASE 
            WHEN evaluation_score >= 70 THEN 'success'
            WHEN evaluation_score >= 50 THEN 'warning'
            ELSE 'error'
        END,
        'evaluation',
        format('/dashboard/jobs/%s/candidates/%s', NEW.job_id, NEW.candidate_id),
        'View Evaluation',
        NULL,
        jsonb_build_object(
            'candidate_id', NEW.candidate_id,
            'candidate_email', candidate_email,
            'job_title', job_title,
            'score', evaluation_score,
            'recommendation', evaluation_recommendation
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resume evaluation completion
DROP TRIGGER IF EXISTS trigger_notify_resume_evaluation_complete ON evaluations;
CREATE TRIGGER trigger_notify_resume_evaluation_complete
    AFTER INSERT ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION notify_resume_evaluation_complete();

-- Trigger function for job status changes
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Create notification for job participants
    PERFORM create_job_notification(
        NEW.id,
        'Job Status Updated',
        format('The job "%s" status has been changed from %s to %s', 
               NEW.title,
               COALESCE(OLD.status, 'draft'),
               COALESCE(NEW.status, 'draft')),
        CASE 
            WHEN NEW.status = 'active' THEN 'success'
            WHEN NEW.status = 'closed' THEN 'warning'
            WHEN NEW.status = 'draft' THEN 'info'
            ELSE 'info'
        END,
        'job',
        format('/dashboard/jobs/%s', NEW.id),
        'View Job',
        NULL,
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'job_title', NEW.title
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job status changes
DROP TRIGGER IF EXISTS trigger_notify_job_status_change ON jobs;
CREATE TRIGGER trigger_notify_job_status_change
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_status_change();

-- ============================================================================
-- PART 4: Grant permissions and enable RLS
-- ============================================================================

-- Grant permissions on notification functions
GRANT EXECUTE ON FUNCTION get_job_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_job_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_candidate_application() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_resume_evaluation_complete() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_job_status_change() TO authenticated;

-- Ensure RLS is enabled on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications"
        ON notifications FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications"
        ON notifications FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- PART 5: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_company ON notifications(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_job_user ON job_permissions(job_id, user_id);

-- ============================================================================
-- PART 6: Verification
-- ============================================================================

DO $$
DECLARE
    view_exists BOOLEAN;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check if jobs_comprehensive view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'jobs_comprehensive' 
        AND table_schema = 'public'
    ) INTO view_exists;
    
    -- Count notification functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%job%notification%';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name LIKE '%notify%';
    
    RAISE NOTICE '✅ Job Details and Notifications Enhancement Applied';
    RAISE NOTICE '  - Enhanced jobs_comprehensive view: %', view_exists;
    RAISE NOTICE '  - Notification functions created: %', function_count;
    RAISE NOTICE '  - Notification triggers created: %', trigger_count;
    
    IF view_exists AND function_count >= 2 AND trigger_count >= 3 THEN
        RAISE NOTICE '  - ✅ All enhancements applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some enhancements may need manual verification';
    END IF;
END $$; 