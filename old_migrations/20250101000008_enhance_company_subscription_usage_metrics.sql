-- Enhance company_subscription_details view with detailed usage metrics
-- This migration adds comprehensive usage tracking for the current month

-- Drop the existing view
DROP VIEW IF EXISTS public.company_subscription_details;

-- Recreate the company subscription view with enhanced usage metrics
CREATE OR REPLACE VIEW public.company_subscription_details AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Get the most recent active subscription for the company
    us.id as subscription_id,
    us.status as subscription_status,
    us.started_at as subscription_started_at,
    us.expires_at as subscription_expires_at,
    us.current_period_start,
    us.current_period_end,
    us.trial_start,
    us.trial_end,
    us.cancel_at_period_end,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    us.updated_at as subscription_updated_at,
    
    -- Subscription plan details
    s.id as plan_id,
    s.name as plan_name,
    s.description as plan_description,
    s.price_monthly,
    s.price_yearly,
    s.max_jobs,
    s.max_interviews_per_month,
    s.features as plan_features,
    s.trial_days,
    s.interval,
    s.is_active as plan_is_active,
    
    -- Stripe data (environment-aware)
    s.stripe_price_id_dev,
    s.stripe_price_id_prod,
    s.stripe_price_id_dev_yearly,
    s.stripe_price_id_prod_yearly,
    s.stripe_checkout_link_dev,
    s.stripe_checkout_link_prod,
    s.stripe_checkout_link_dev_yearly,
    s.stripe_checkout_link_prod_yearly,
    
    -- ============================================================================
    -- ENHANCED USAGE METRICS FOR CURRENT MONTH
    -- ============================================================================
    
    -- Total jobs created this month (all jobs, regardless of status)
    (
        SELECT COUNT(*) 
        FROM public.jobs j
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id 
        AND j.created_at >= date_trunc('month', NOW())
    ) as total_jobs_created_this_month,
    
    -- Active jobs this month (jobs where is_active = true AND status = 'interviewing')
    (
        SELECT COUNT(*) 
        FROM public.jobs j
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id 
        AND j.is_active = true 
        AND j.status = 'interviewing'
        AND j.created_at >= date_trunc('month', NOW())
    ) as active_jobs_this_month,
    
    -- Total active jobs (all time, regardless of creation date)
    (
        SELECT COUNT(*) 
        FROM public.jobs j
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id 
        AND j.is_active = true 
        AND j.status = 'interviewing'
    ) as total_active_jobs,
    
    -- Successful interviews this month (candidates with submitted_at in current month)
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id 
        AND ca.submitted_at >= date_trunc('month', NOW())
        AND ca.submitted_at IS NOT NULL
    ) as successful_interviews_this_month,
    
    -- Total interviews this month (all candidates, regardless of submission status)
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id 
        AND ca.created_at >= date_trunc('month', NOW())
    ) as total_interviews_this_month,
    
    -- Company usage counts (aggregated from all users in the company) - LEGACY
    (
        SELECT COUNT(*) 
        FROM public.jobs j
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id AND j.is_active = true
    ) as company_active_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        JOIN public.profiles p ON j.profile_id = p.id
        WHERE p.company_id = c.id 
        AND ca.submitted_at >= date_trunc('month', NOW())
    ) as company_interviews_this_month,
    
    -- Company user count
    (
        SELECT COUNT(*) 
        FROM public.profiles p2
        WHERE p2.company_id = c.id
    ) as company_user_count

FROM public.companies c
LEFT JOIN LATERAL (
    -- Get the most recent active subscription for the company
    SELECT us.*
    FROM public.user_subscriptions us
    JOIN public.profiles p ON us.user_id = p.id
    WHERE p.company_id = c.id 
    AND us.status IN ('active', 'trialing')
    ORDER BY us.created_at DESC
    LIMIT 1
) us ON true
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id;

-- Grant access to the view
GRANT SELECT ON public.company_subscription_details TO authenticated;
GRANT SELECT ON public.company_subscription_details TO service_role;

-- Drop the existing function before recreating it with new return type
DROP FUNCTION IF EXISTS get_company_subscription(UUID);

-- Update the get_company_subscription function to include new metrics
CREATE OR REPLACE FUNCTION get_company_subscription(user_id UUID)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    company_slug TEXT,
    subscription_status TEXT,
    plan_name TEXT,
    plan_description TEXT,
    price_monthly DECIMAL,
    price_yearly DECIMAL,
    max_jobs INTEGER,
    max_interviews_per_month INTEGER,
    features JSONB,
    total_jobs_created_this_month BIGINT,
    active_jobs_this_month BIGINT,
    total_active_jobs BIGINT,
    successful_interviews_this_month BIGINT,
    total_interviews_this_month BIGINT,
    company_active_jobs_count BIGINT,
    company_interviews_this_month BIGINT,
    company_user_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        csd.company_id,
        csd.company_name,
        csd.company_slug,
        csd.subscription_status,
        csd.plan_name,
        csd.plan_description,
        csd.price_monthly,
        csd.price_yearly,
        csd.max_jobs,
        csd.max_interviews_per_month,
        csd.plan_features,
        csd.total_jobs_created_this_month,
        csd.active_jobs_this_month,
        csd.total_active_jobs,
        csd.successful_interviews_this_month,
        csd.total_interviews_this_month,
        csd.company_active_jobs_count,
        csd.company_interviews_this_month,
        csd.company_user_count
    FROM public.company_subscription_details csd
    JOIN public.profiles p ON p.company_id = csd.company_id
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_company_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_subscription(UUID) TO service_role;

-- Set the view to use security invoker (runs with the permissions of the calling user)
ALTER VIEW public.company_subscription_details SET (security_invoker = true);

-- Create a helper function to get current month usage for a specific user
CREATE OR REPLACE FUNCTION get_user_current_month_usage(user_id UUID)
RETURNS TABLE (
    total_jobs_created BIGINT,
    active_jobs BIGINT,
    successful_interviews BIGINT,
    total_interviews BIGINT,
    current_month TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total jobs created this month
        (
            SELECT COUNT(*) 
            FROM public.jobs j
            WHERE j.profile_id = user_id 
            AND j.created_at >= date_trunc('month', NOW())
        ) as total_jobs_created,
        
        -- Active jobs this month
        (
            SELECT COUNT(*) 
            FROM public.jobs j
            WHERE j.profile_id = user_id 
            AND j.is_active = true 
            AND j.status = 'interviewing'
            AND j.created_at >= date_trunc('month', NOW())
        ) as active_jobs,
        
        -- Successful interviews this month
        (
            SELECT COUNT(*) 
            FROM public.candidates ca
            JOIN public.jobs j ON ca.job_id = j.id
            WHERE j.profile_id = user_id 
            AND ca.submitted_at >= date_trunc('month', NOW())
            AND ca.submitted_at IS NOT NULL
        ) as successful_interviews,
        
        -- Total interviews this month
        (
            SELECT COUNT(*) 
            FROM public.candidates ca
            JOIN public.jobs j ON ca.job_id = j.id
            WHERE j.profile_id = user_id 
            AND ca.created_at >= date_trunc('month', NOW())
        ) as total_interviews,
        
        -- Current month name
        to_char(NOW(), 'Month YYYY') as current_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION get_user_current_month_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_current_month_usage(UUID) TO service_role;

-- Verify the migration
DO $$
BEGIN
    RAISE NOTICE 'Company subscription view enhanced with detailed usage metrics';
    RAISE NOTICE 'New metrics added:';
    RAISE NOTICE '  - total_jobs_created_this_month';
    RAISE NOTICE '  - active_jobs_this_month';
    RAISE NOTICE '  - total_active_jobs';
    RAISE NOTICE '  - successful_interviews_this_month';
    RAISE NOTICE '  - total_interviews_this_month';
    RAISE NOTICE 'Function get_user_current_month_usage() created for individual user metrics';
END $$; 