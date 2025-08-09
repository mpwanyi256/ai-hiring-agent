-- Migration: Add automatic email notifications for team events
-- This migration extends the audit logging triggers to also send email notifications

-- Create function to send HTTP requests for email notifications
CREATE OR REPLACE FUNCTION notify_email_api(
    endpoint TEXT,
    payload JSONB
) RETURNS VOID AS $$
BEGIN
    -- Use pg_net extension to make HTTP requests (if available)
    -- Otherwise, we'll handle this in application code
    
    -- For now, we'll log the notification intent
    -- The actual email sending will be triggered by application code
    INSERT INTO public.user_activities (
        user_id, 
        event_type, 
        entity_id, 
        entity_type, 
        message, 
        meta
    ) VALUES (
        auth.uid(),
        'email_notification_queued',
        gen_random_uuid(),
        'notification',
        'Email notification queued for sending',
        jsonb_build_object(
            'endpoint', endpoint,
            'payload', payload,
            'queued_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update job permission granted trigger to include email notification
CREATE OR REPLACE FUNCTION log_job_permission_granted()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    user_name TEXT;
    granter_name TEXT;
    user_email TEXT;
    notification_payload JSONB;
BEGIN
    SET search_path = 'public';
    
    -- Get job title
    SELECT title INTO job_title FROM public.jobs WHERE id = NEW.job_id;
    
    -- Get user details
    SELECT 
        first_name || ' ' || COALESCE(last_name, ''),
        email
    INTO user_name, user_email 
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Get granter name
    SELECT first_name || ' ' || COALESCE(last_name, '') INTO granter_name 
    FROM public.profiles WHERE id = NEW.granted_by;
    
    -- Log the activity
    INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
    VALUES (
        NEW.granted_by,
        'job_permission_granted',
        NEW.id,
        'job_permission',
        'Job access granted to team member',
        jsonb_build_object(
            'job_id', NEW.job_id,
            'job_title', job_title,
            'user_id', NEW.user_id,
            'user_name', user_name,
            'user_email', user_email,
            'permission_level', NEW.permission_level,
            'granted_by_name', granter_name,
            'should_send_email', true
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update invite accepted trigger to include email notification
CREATE OR REPLACE FUNCTION log_team_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = 'public';
    -- Only log when status changes to 'accepted'
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
        VALUES (
            NEW.invited_by,
            'team_invite_accepted',
            NEW.id,
            'invite',
            'Team invitation accepted',
            jsonb_build_object(
                'invitee_email', NEW.email,
                'invitee_name', NEW.first_name || ' ' || COALESCE(NEW.last_name, ''),
                'role', NEW.role,
                'company_id', NEW.company_id,
                'accepted_at', NOW(),
                'should_send_email', true
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update invite rejected trigger to include email notification
CREATE OR REPLACE FUNCTION log_team_invite_rejected()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = 'public';
    -- Only log when status changes to 'rejected'
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
        VALUES (
            NEW.invited_by,
            'team_invite_rejected',
            NEW.id,
            'invite',
            'Team invitation declined',
            jsonb_build_object(
                'invitee_email', NEW.email,
                'invitee_name', NEW.first_name || ' ' || COALESCE(NEW.last_name, ''),
                'role', NEW.role,
                'company_id', NEW.company_id,
                'rejected_at', NOW(),
                'should_send_email', true
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update job permission revoked trigger to include email notification
CREATE OR REPLACE FUNCTION log_job_permission_revoked()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    user_name TEXT;
    user_email TEXT;
    revoker_name TEXT;
BEGIN
    SET search_path = 'public';
    
    -- Get job title
    SELECT title INTO job_title FROM public.jobs WHERE id = OLD.job_id;
    
    -- Get user details
    SELECT 
        first_name || ' ' || COALESCE(last_name, ''),
        email
    INTO user_name, user_email 
    FROM public.profiles WHERE id = OLD.user_id;
    
    -- Get revoker name (assume current auth user for deletes)
    SELECT first_name || ' ' || COALESCE(last_name, '') INTO revoker_name 
    FROM public.profiles WHERE id = auth.uid();
    
    INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
    VALUES (
        COALESCE(auth.uid(), OLD.granted_by),
        'job_permission_revoked',
        OLD.id,
        'job_permission',
        'Job access revoked from team member',
        jsonb_build_object(
            'job_id', OLD.job_id,
            'job_title', job_title,
            'user_id', OLD.user_id,
            'user_name', user_name,
            'user_email', user_email,
            'permission_level', OLD.permission_level,
            'revoked_by_name', revoker_name,
            'should_send_email', true
        )
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to get activities that need email notifications
CREATE OR REPLACE VIEW public.pending_email_notifications AS
SELECT 
    ua.id,
    ua.user_id,
    ua.event_type,
    ua.entity_id,
    ua.entity_type,
    ua.message,
    ua.meta,
    ua.created_at,
    p.first_name || ' ' || COALESCE(p.last_name, '') as user_name,
    p.email as user_email,
    p.company_id
FROM public.user_activities ua
JOIN public.profiles p ON ua.user_id = p.id
WHERE ua.meta ? 'should_send_email' 
AND (ua.meta->>'should_send_email')::boolean = true
AND ua.event_type IN (
    'job_permission_granted',
    'job_permission_revoked',
    'team_invite_accepted',
    'team_invite_rejected'
)
AND ua.created_at >= NOW() - INTERVAL '1 hour'  -- Only recent notifications
ORDER BY ua.created_at DESC;

-- Set security invoker for the view
ALTER VIEW public.pending_email_notifications SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON public.pending_email_notifications TO authenticated;
GRANT UPDATE ON public.user_activities TO authenticated;

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION notify_email_api(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION notify_email_api(TEXT, JSONB) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION notify_email_api(TEXT, JSONB) IS 'Queues email notifications for sending via API';
COMMENT ON VIEW public.pending_email_notifications IS 'View showing user activities that need email notifications'; 