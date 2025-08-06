-- Migration: Add comprehensive audit logging for teams activities
-- This migration extends the existing user_activities table with teams-specific event tracking

-- Create trigger function for logging team invite sent
CREATE OR REPLACE FUNCTION log_team_invite_sent()
RETURNS TRIGGER AS $$
BEGIN
    SET search_path = 'public';
    INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
    VALUES (
        NEW.invited_by,
        'team_invite_sent',
        NEW.id,
        'invite',
        'Team invitation sent',
        jsonb_build_object(
            'invitee_email', NEW.email,
            'invitee_name', NEW.first_name || ' ' || COALESCE(NEW.last_name, ''),
            'role', NEW.role,
            'company_id', NEW.company_id,
            'expires_at', NEW.expires_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invite sent
CREATE TRIGGER trg_log_team_invite_sent
    AFTER INSERT ON public.invites
    FOR EACH ROW EXECUTE FUNCTION log_team_invite_sent();

-- Create trigger function for logging invite accepted
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
                'accepted_at', NOW()
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invite accepted
CREATE TRIGGER trg_log_team_invite_accepted
    AFTER UPDATE ON public.invites
    FOR EACH ROW EXECUTE FUNCTION log_team_invite_accepted();

-- Create trigger function for logging invite rejected
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
                'rejected_at', NOW()
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invite rejected (uses same update trigger, different function)
CREATE TRIGGER trg_log_team_invite_rejected
    AFTER UPDATE ON public.invites
    FOR EACH ROW EXECUTE FUNCTION log_team_invite_rejected();

-- Create trigger function for logging job permission granted
CREATE OR REPLACE FUNCTION log_job_permission_granted()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    user_name TEXT;
    granter_name TEXT;
BEGIN
    SET search_path = 'public';
    
    -- Get job title
    SELECT title INTO job_title FROM public.jobs WHERE id = NEW.job_id;
    
    -- Get user name
    SELECT first_name || ' ' || COALESCE(last_name, '') INTO user_name 
    FROM public.profiles WHERE id = NEW.user_id;
    
    -- Get granter name
    SELECT first_name || ' ' || COALESCE(last_name, '') INTO granter_name 
    FROM public.profiles WHERE id = NEW.granted_by;
    
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
            'permission_level', NEW.permission_level,
            'granted_by_name', granter_name
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job permission granted
CREATE TRIGGER trg_log_job_permission_granted
    AFTER INSERT ON public.job_permissions
    FOR EACH ROW EXECUTE FUNCTION log_job_permission_granted();

-- Create trigger function for logging job permission updated
CREATE OR REPLACE FUNCTION log_job_permission_updated()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    user_name TEXT;
    updater_name TEXT;
BEGIN
    SET search_path = 'public';
    
    -- Only log if permission level actually changed
    IF OLD.permission_level != NEW.permission_level THEN
        -- Get job title
        SELECT title INTO job_title FROM public.jobs WHERE id = NEW.job_id;
        
        -- Get user name
        SELECT first_name || ' ' || COALESCE(last_name, '') INTO user_name 
        FROM public.profiles WHERE id = NEW.user_id;
        
        -- Get updater name (assume current auth user for updates)
        SELECT first_name || ' ' || COALESCE(last_name, '') INTO updater_name 
        FROM public.profiles WHERE id = auth.uid();
        
        INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
        VALUES (
            COALESCE(auth.uid(), NEW.granted_by),
            'job_permission_updated',
            NEW.id,
            'job_permission',
            'Job access level updated',
            jsonb_build_object(
                'job_id', NEW.job_id,
                'job_title', job_title,
                'user_id', NEW.user_id,
                'user_name', user_name,
                'old_permission_level', OLD.permission_level,
                'new_permission_level', NEW.permission_level,
                'updated_by_name', updater_name
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job permission updated
CREATE TRIGGER trg_log_job_permission_updated
    AFTER UPDATE ON public.job_permissions
    FOR EACH ROW EXECUTE FUNCTION log_job_permission_updated();

-- Create trigger function for logging job permission revoked
CREATE OR REPLACE FUNCTION log_job_permission_revoked()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    user_name TEXT;
    revoker_name TEXT;
BEGIN
    SET search_path = 'public';
    
    -- Get job title
    SELECT title INTO job_title FROM public.jobs WHERE id = OLD.job_id;
    
    -- Get user name
    SELECT first_name || ' ' || COALESCE(last_name, '') INTO user_name 
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
            'permission_level', OLD.permission_level,
            'revoked_by_name', revoker_name
        )
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job permission revoked
CREATE TRIGGER trg_log_job_permission_revoked
    AFTER DELETE ON public.job_permissions
    FOR EACH ROW EXECUTE FUNCTION log_job_permission_revoked();

-- Create trigger function for logging team member removed
CREATE OR REPLACE FUNCTION log_team_member_removed()
RETURNS TRIGGER AS $$
DECLARE
    remover_name TEXT;
BEGIN
    SET search_path = 'public';
    
    -- Get remover name (assume current auth user)
    SELECT first_name || ' ' || COALESCE(last_name, '') INTO remover_name 
    FROM public.profiles WHERE id = auth.uid();
    
    INSERT INTO public.user_activities (user_id, event_type, entity_id, entity_type, message, meta)
    VALUES (
        COALESCE(auth.uid(), OLD.id),
        'team_member_removed',
        OLD.id,
        'profile',
        'Team member removed from company',
        jsonb_build_object(
            'removed_user_id', OLD.id,
            'removed_user_name', OLD.first_name || ' ' || COALESCE(OLD.last_name, ''),
            'removed_user_email', OLD.email,
            'removed_user_role', OLD.role,
            'company_id', OLD.company_id,
            'removed_by_name', remover_name
        )
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for team member removed (when profile is deleted or company_id is changed to NULL)
CREATE TRIGGER trg_log_team_member_removed
    AFTER DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION log_team_member_removed();

-- Grant execute permissions on all new functions
GRANT EXECUTE ON FUNCTION log_team_invite_sent() TO service_role;
GRANT EXECUTE ON FUNCTION log_team_invite_accepted() TO service_role;
GRANT EXECUTE ON FUNCTION log_team_invite_rejected() TO service_role;
GRANT EXECUTE ON FUNCTION log_job_permission_granted() TO service_role;
GRANT EXECUTE ON FUNCTION log_job_permission_updated() TO service_role;
GRANT EXECUTE ON FUNCTION log_job_permission_revoked() TO service_role;
GRANT EXECUTE ON FUNCTION log_team_member_removed() TO service_role;

-- Create a view for teams-specific activities
CREATE OR REPLACE VIEW public.team_activities AS
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
WHERE ua.event_type IN (
    'team_invite_sent',
    'team_invite_accepted', 
    'team_invite_rejected',
    'job_permission_granted',
    'job_permission_updated',
    'job_permission_revoked',
    'team_member_removed'
)
ORDER BY ua.created_at DESC;

-- Set security invoker for the view
ALTER VIEW public.team_activities SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON public.team_activities TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION log_team_invite_sent() IS 'Logs when a team invitation is sent';
COMMENT ON FUNCTION log_team_invite_accepted() IS 'Logs when a team invitation is accepted';
COMMENT ON FUNCTION log_team_invite_rejected() IS 'Logs when a team invitation is rejected';
COMMENT ON FUNCTION log_job_permission_granted() IS 'Logs when job permissions are granted to a team member';
COMMENT ON FUNCTION log_job_permission_updated() IS 'Logs when job permission levels are updated';
COMMENT ON FUNCTION log_job_permission_revoked() IS 'Logs when job permissions are revoked from a team member';
COMMENT ON FUNCTION log_team_member_removed() IS 'Logs when a team member is removed from the company';
COMMENT ON VIEW public.team_activities IS 'View showing all team-related audit activities'; 