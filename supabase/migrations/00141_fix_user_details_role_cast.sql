-- 00141_fix_user_details_role_cast.sql
-- Cast role to text in user_details view to stabilize PostgREST prepared statements

SET search_path = public;

DROP VIEW IF EXISTS public.user_details CASCADE;

CREATE VIEW public.user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role::text AS role,
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
LEFT JOIN public.user_subscriptions us ON p.id = us.profile_id
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id;

ALTER VIEW public.user_details SET (security_invoker = on);
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role; 