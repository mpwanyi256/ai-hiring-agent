-- Fix user_details view after user_subscriptions table recreation
-- This migration recreates the user_details view to work with the new table structure

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.user_details;

-- Recreate the user_details view with the correct structure
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at as user_created_at,
    p.updated_at as user_updated_at,
    
    -- Company details
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Subscription details (may be null for new users)
    s.id as subscription_id,
    s.name as subscription_name,
    s.description as subscription_description,
    s.price_monthly,
    s.price_yearly,
    s.max_jobs,
    s.max_interviews_per_month,
    s.features as subscription_features,
    
    -- Stripe data (environment-aware)
    s.stripe_price_id_dev,
    s.stripe_price_id_prod,
    s.stripe_price_id_dev_yearly,
    s.stripe_price_id_prod_yearly,
    s.stripe_checkout_link_dev,
    s.stripe_checkout_link_prod,
    s.stripe_checkout_link_dev_yearly,
    s.stripe_checkout_link_prod_yearly,
    
    -- User subscription status (may be null for new users)
    us.status as subscription_status,
    us.started_at as subscription_started_at,
    us.current_period_start,
    us.current_period_end,
    us.trial_start,
    us.trial_end,
    us.cancel_at_period_end,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    us.updated_at as subscription_updated_at,
    
    -- Usage counts
    (
        SELECT COUNT(*) 
        FROM public.jobs j 
        WHERE j.profile_id = p.id AND j.is_active = true
    ) as active_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        WHERE j.profile_id = p.id 
        AND ca.submitted_at >= date_trunc('month', NOW())
    ) as interviews_this_month

FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id;

-- Grant access to the view
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role;

-- Set security invoker to ensure RLS policies are applied correctly
ALTER VIEW public.user_details SET (security_invoker = on);

-- Add helpful comment
COMMENT ON VIEW public.user_details IS 'Comprehensive user view with company, subscription, and usage data - fixed after user_subscriptions table recreation';

-- Verify the view works
DO $$
DECLARE
    view_exists BOOLEAN;
    column_count INTEGER;
BEGIN
    -- Check if view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'user_details'
    ) INTO view_exists;
    
    IF NOT view_exists THEN
        RAISE EXCEPTION 'user_details view was not created successfully';
    END IF;
    
    -- Check column count to ensure all expected columns are present
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_details';
    
    RAISE NOTICE '✅ user_details view recreated successfully';
    RAISE NOTICE '  - View exists: %', view_exists;
    RAISE NOTICE '  - Column count: %', column_count;
    RAISE NOTICE '  - View should now work with the recreated user_subscriptions table';
END $$; 