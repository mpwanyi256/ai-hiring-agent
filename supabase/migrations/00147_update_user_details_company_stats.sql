-- 00147_update_user_details_company_stats.sql
-- Make user_details stats company-wide (based on profiles.company_id)

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
    
    -- Subscription details (company-wide)
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
    
    -- Company subscription status (selected from a company member's subscription)
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
    
    -- Company-wide usage counts (was per-profile)
    (
        SELECT COUNT(*) 
        FROM public.jobs j
        JOIN public.profiles pj ON pj.id = j.profile_id
        WHERE pj.company_id = p.company_id AND j.is_active = true
    ) as active_jobs_count,
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        JOIN public.profiles pj ON pj.id = j.profile_id
        WHERE pj.company_id = p.company_id 
          AND ca.submitted_at >= date_trunc('month', NOW())
    ) as interviews_this_month
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
-- Choose a single company subscription visible to company members
LEFT JOIN LATERAL (
  SELECT us.*
  FROM public.user_subscriptions us
  JOIN public.profiles owner ON owner.id = us.profile_id
  WHERE owner.company_id = p.company_id
  ORDER BY 
    CASE WHEN coalesce(us.status,'') IN ('active','trialing') THEN 0 ELSE 1 END,
    us.updated_at DESC NULLS LAST,
    us.started_at DESC NULLS LAST
  LIMIT 1
) us ON TRUE
LEFT JOIN public.subscriptions s ON s.id = us.subscription_id;

ALTER VIEW public.user_details SET (security_invoker = on);
GRANT SELECT ON public.user_details TO authenticator;
GRANT SELECT ON public.user_details TO anon;
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role; 