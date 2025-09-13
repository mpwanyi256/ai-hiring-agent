-- Update user_details view to include last_sign_in_at from auth.users
-- This provides comprehensive user activity information for admin dashboards

-- Drop the existing view
DROP VIEW IF EXISTS user_details;

-- Recreate the view with last_sign_in_at included
CREATE VIEW user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role::text AS role,
    p.created_at AS user_created_at,
    p.updated_at AS user_updated_at,
    au.last_sign_in_at,  -- Added from auth.users
    c.id AS company_id,
    c.name AS company_name,
    c.slug AS company_slug,
    c.created_at AS company_created_at,
    s.id AS subscription_id,
    s.name AS subscription_name,
    s.description AS subscription_description,
    s.price_monthly,
    s.price_yearly,
    s.max_jobs,
    s.max_interviews_per_month,
    s.features AS subscription_features,
    s.stripe_price_id_dev,
    s.stripe_price_id_prod,
    s.stripe_price_id_dev_yearly,
    s.stripe_price_id_prod_yearly,
    s.stripe_checkout_link_dev,
    s.stripe_checkout_link_prod,
    s.stripe_checkout_link_dev_yearly,
    s.stripe_checkout_link_prod_yearly,
    us.status AS subscription_status,
    us.started_at AS subscription_started_at,
    us.current_period_start,
    us.current_period_end,
    us.trial_start,
    us.trial_end,
    us.cancel_at_period_end,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    us.updated_at AS subscription_updated_at,
    (
        SELECT count(*) 
        FROM jobs j
        JOIN profiles pj ON pj.id = j.profile_id
        WHERE pj.company_id = p.company_id 
        AND j.is_active = true
    ) AS active_jobs_count,
    (
        SELECT count(*) 
        FROM candidates ca
        JOIN jobs j ON ca.job_id = j.id
        JOIN profiles pj ON pj.id = j.profile_id
        WHERE pj.company_id = p.company_id 
        AND ca.submitted_at >= date_trunc('month', now())
    ) AS interviews_this_month
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id  -- Join with auth.users for last_sign_in_at
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN LATERAL (
    SELECT 
        us1.id,
        us1.profile_id,
        us1.subscription_id,
        us1.status,
        us1.started_at,
        us1.expires_at,
        us1.current_period_start,
        us1.current_period_end,
        us1.trial_start,
        us1.trial_end,
        us1.cancel_at_period_end,
        us1.stripe_customer_id,
        us1.stripe_subscription_id,
        us1.created_at,
        us1.updated_at
    FROM user_subscriptions us1
    JOIN profiles owner ON owner.id = us1.profile_id
    WHERE owner.company_id = p.company_id
    ORDER BY 
        CASE 
            WHEN COALESCE(us1.status, '') = ANY(ARRAY['active', 'trialing']) THEN 0 
            ELSE 1 
        END,
        us1.updated_at DESC NULLS LAST,
        us1.started_at DESC NULLS LAST
    LIMIT 1
) us ON true
LEFT JOIN subscriptions s ON s.id = us.subscription_id;

-- Grant permissions to authenticated users and service_role
GRANT SELECT ON user_details TO authenticated, service_role;

-- Add comment for documentation
COMMENT ON VIEW user_details IS 'Comprehensive view of user details including profile, company, subscription, and activity information with last sign-in data from auth.users';
