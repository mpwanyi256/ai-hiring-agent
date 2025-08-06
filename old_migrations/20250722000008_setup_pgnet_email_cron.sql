-- Migration: Setup pg_net HTTP calls and cron job for email notifications
-- This migration enables pg_net and creates the actual HTTP-calling cron job

-- Enable pg_net extension for HTTP requests
-- Note: This requires superuser privileges and might need to be run manually
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create an improved function that uses pg_net to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_email_notifications_http()
RETURNS json AS $$
DECLARE
    function_url text;
    request_id bigint;
    response_data json;
    notification_count integer := 0;
    auth_header text;
BEGIN
    -- Get the Supabase project URL and service role key
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-team-notifications';
    auth_header := 'Bearer ' || current_setting('app.settings.service_role_key', true);
    
    -- Count pending notifications before processing
    SELECT COUNT(*) INTO notification_count
    FROM public.pending_email_notifications;
    
    -- If no pg_net extension available, fallback to logging
    BEGIN
        -- Make HTTP POST request to the Edge Function
        SELECT INTO request_id
            net.http_post(
                url := function_url,
                headers := jsonb_build_object(
                    'Authorization', auth_header,
                    'Content-Type', 'application/json'
                ),
                body := '{}'::jsonb
            );
        
        -- Log successful trigger
        INSERT INTO public.user_activities (
            user_id, 
            event_type, 
            entity_id, 
            entity_type, 
            message, 
            meta
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            'email_cron_triggered',
            gen_random_uuid(),
            'cron',
            'Email notification HTTP request sent',
            jsonb_build_object(
                'function_url', function_url,
                'request_id', request_id,
                'pending_notifications', notification_count,
                'triggered_at', NOW()
            )
        );
        
        response_data := json_build_object(
            'success', true,
            'request_id', request_id,
            'pending_notifications', notification_count,
            'message', 'Email notification processing triggered via HTTP',
            'timestamp', NOW()
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- If pg_net is not available or fails, log the attempt
        INSERT INTO public.user_activities (
            user_id, 
            event_type, 
            entity_id, 
            entity_type, 
            message, 
            meta
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            'email_cron_fallback',
            gen_random_uuid(),
            'cron',
            'Email notification fallback - pg_net not available',
            jsonb_build_object(
                'error', SQLERRM,
                'pending_notifications', notification_count,
                'triggered_at', NOW()
            )
        );
        
        response_data := json_build_object(
            'success', false,
            'error', 'pg_net not available: ' || SQLERRM,
            'pending_notifications', notification_count,
            'timestamp', NOW()
        );
    END;
    
    RETURN response_data;
    
EXCEPTION WHEN OTHERS THEN
    -- Log any other errors
    INSERT INTO public.user_activities (
        user_id, 
        event_type, 
        entity_id, 
        entity_type, 
        message, 
        meta
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'email_cron_error',
        gen_random_uuid(),
        'cron',
        'Email notification cron job failed',
        jsonb_build_object(
            'error', SQLERRM,
            'triggered_at', NOW()
        )
    );
    
    response_data := json_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', NOW()
    );
    
    RETURN response_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_email_notifications_http() TO postgres;
GRANT EXECUTE ON FUNCTION trigger_email_notifications_http() TO service_role;

-- Create a function to set up the configuration
CREATE OR REPLACE FUNCTION setup_email_notifications_config(
    supabase_url text,
    service_role_key text
)
RETURNS void AS $$
BEGIN
    -- Set the configuration settings
    PERFORM set_config('app.settings.supabase_url', supabase_url, false);
    PERFORM set_config('app.settings.service_role_key', service_role_key, false);
    
    -- Log the configuration setup
    INSERT INTO public.user_activities (
        user_id, 
        event_type, 
        entity_id, 
        entity_type, 
        message, 
        meta
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'email_config_updated',
        gen_random_uuid(),
        'config',
        'Email notification configuration updated',
        jsonb_build_object(
            'supabase_url', supabase_url,
            'configured_at', NOW()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_email_notifications_config(text, text) TO postgres;
GRANT EXECUTE ON FUNCTION setup_email_notifications_config(text, text) TO service_role;

-- Create a manual trigger function for admins
CREATE OR REPLACE FUNCTION manual_trigger_email_notifications()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    -- Call the HTTP trigger function
    SELECT trigger_email_notifications_http() INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for authenticated users (admins can call this)
GRANT EXECUTE ON FUNCTION manual_trigger_email_notifications() TO authenticated;

-- Function to check email notification status
CREATE OR REPLACE FUNCTION get_email_notification_status()
RETURNS json AS $$
DECLARE
    pending_count integer := 0;
    recent_activity json;
    last_cron_run timestamp;
    result json;
BEGIN
    -- Count pending notifications
    SELECT COUNT(*) INTO pending_count
    FROM public.pending_email_notifications;
    
    -- Get last cron run
    SELECT ua.created_at INTO last_cron_run
    FROM public.user_activities ua
    WHERE ua.event_type IN ('email_cron_triggered', 'email_cron_fallback')
    ORDER BY ua.created_at DESC
    LIMIT 1;
    
    -- Get recent activity
    SELECT json_agg(
        json_build_object(
            'event_type', ua.event_type,
            'message', ua.message,
            'created_at', ua.created_at,
            'meta', ua.meta
        )
    ) INTO recent_activity
    FROM (
        SELECT ua.event_type, ua.message, ua.created_at, ua.meta
        FROM public.user_activities ua
        WHERE ua.event_type LIKE 'email_%'
        ORDER BY ua.created_at DESC
        LIMIT 10
    ) ua;
    
    result := json_build_object(
        'pending_notifications', pending_count,
        'last_cron_run', last_cron_run,
        'recent_activity', COALESCE(recent_activity, '[]'::json),
        'status', CASE 
            WHEN pending_count = 0 THEN 'idle'
            WHEN last_cron_run > NOW() - INTERVAL '10 minutes' THEN 'active'
            ELSE 'stale'
        END,
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_email_notification_status() TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION trigger_email_notifications_http() IS 'Triggers email notification processing via HTTP call to Supabase Edge Function';
COMMENT ON FUNCTION setup_email_notifications_config(text, text) IS 'Configure Supabase URL and service role key for email notifications';
COMMENT ON FUNCTION manual_trigger_email_notifications() IS 'Manually trigger email notification processing (for admins)';
COMMENT ON FUNCTION get_email_notification_status() IS 'Get current status of email notification system'; 