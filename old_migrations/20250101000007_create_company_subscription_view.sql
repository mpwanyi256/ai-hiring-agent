-- Create a view that returns the current subscription for a logged-in user's company
-- This ensures that multiple users from the same company share the same subscription

-- Drop the view if it exists
DROP VIEW IF EXISTS public.company_subscription_details;

-- Create the company subscription view
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
    
    -- Company usage counts (aggregated from all users in the company)
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

-- Create a function to get company subscription for a specific user
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

-- Verify the migration
DO $$
BEGIN
    RAISE NOTICE 'Company subscription view created successfully';
    RAISE NOTICE 'Function get_company_subscription() created successfully';
    RAISE NOTICE 'View set to security_invoker mode for proper access control';
END $$; 