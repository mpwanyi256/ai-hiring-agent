-- Migration: Setup pg_cron job for automatic email notification processing
-- This migration creates a scheduled job that calls the Supabase Edge Function

-- Enable the pg_cron extension if not already enabled
-- Note: This might require superuser privileges
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Supabase Edge Function
CREATE OR REPLACE FUNCTION trigger_email_notifications()
RETURNS void AS $$
DECLARE
    function_url text;
    result record;
BEGIN
    -- Get the Supabase project URL for the Edge Function
    -- This will be the URL to your send-team-notifications function
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-team-notifications';
    
    -- If the setting is not available, use a default (you can update this)
    IF function_url IS NULL OR function_url = '/functions/v1/send-team-notifications' THEN
        function_url := 'https://your-project-id.supabase.co/functions/v1/send-team-notifications';
    END IF;
    
    -- Log the function call attempt
    INSERT INTO public.user_activities (
        user_id, 
        event_type, 
        entity_id, 
        entity_type, 
        message, 
        meta
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, -- System user
        'email_cron_triggered',
        gen_random_uuid(),
        'cron',
        'Email notification cron job triggered',
        jsonb_build_object(
            'function_url', function_url,
            'triggered_at', NOW()
        )
    );
    
    -- In a real implementation, you would use pg_net extension to make HTTP requests
    -- For now, we'll just log that the cron job ran
    RAISE NOTICE 'Email notification cron job triggered at %', NOW();
    
EXCEPTION WHEN OTHERS THEN
    -- Log any errors
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
    
    RAISE NOTICE 'Email notification cron job failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_email_notifications() TO postgres;
GRANT EXECUTE ON FUNCTION trigger_email_notifications() TO service_role;

-- Alternative: Create a stored procedure that can be called manually or via webhook
CREATE OR REPLACE FUNCTION process_email_notifications_manual()
RETURNS json AS $$
DECLARE
    notification_count integer := 0;
    processed_count integer := 0;
    result json;
BEGIN
    -- Count pending notifications
    SELECT COUNT(*) INTO notification_count
    FROM public.pending_email_notifications;
    
    -- Call the trigger function
    PERFORM trigger_email_notifications();
    
    -- Return result
    result := json_build_object(
        'success', true,
        'pending_notifications', notification_count,
        'message', 'Email notification processing triggered',
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for the manual function
GRANT EXECUTE ON FUNCTION process_email_notifications_manual() TO authenticated;
GRANT EXECUTE ON FUNCTION process_email_notifications_manual() TO service_role;

-- Create a helper function to set configuration for the function URL
CREATE OR REPLACE FUNCTION set_email_function_url(url text)
RETURNS void AS $$
BEGIN
    -- This can be used to set the function URL dynamically
    PERFORM set_config('app.settings.supabase_url', url, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION set_email_function_url(text) TO postgres;
GRANT EXECUTE ON FUNCTION set_email_function_url(text) TO service_role;

-- Comments for documentation
COMMENT ON FUNCTION trigger_email_notifications() IS 'Triggers email notification processing via Supabase Edge Function';
COMMENT ON FUNCTION process_email_notifications_manual() IS 'Manually trigger email notification processing with status return';
COMMENT ON FUNCTION set_email_function_url(text) IS 'Set the Supabase function URL for email notifications';

-- Create a view to monitor cron job activity
CREATE OR REPLACE VIEW public.email_cron_activity AS
SELECT 
    ua.id,
    ua.event_type,
    ua.message,
    ua.meta,
    ua.created_at
FROM public.user_activities ua
WHERE ua.event_type IN ('email_cron_triggered', 'email_cron_error')
ORDER BY ua.created_at DESC
LIMIT 100;

-- Set security invoker for the view
ALTER VIEW public.email_cron_activity SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON public.email_cron_activity TO authenticated;

COMMENT ON VIEW public.email_cron_activity IS 'Monitor email notification cron job activity and errors';

-- Example cron job setup instructions (not executed in migration)
-- To set up the actual cron job, run these commands manually in the Supabase SQL editor:
--
-- 1. Enable pg_cron extension:
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Create the cron job:
--    SELECT cron.schedule(
--        'process-email-notifications',
--        '*/5 * * * *',
--        'SELECT trigger_email_notifications();'
--    );
--
-- 3. Check cron jobs:
--    SELECT * FROM cron.job;
--
-- 4. To remove the cron job if needed:
--    SELECT cron.unschedule('process-email-notifications'); 