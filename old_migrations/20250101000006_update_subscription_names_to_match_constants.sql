-- Comprehensive migration to align database with constants and add environment-aware Stripe fields
-- This migration updates subscription data to match stripePlans constants
-- and adds support for both development and production Stripe keys

-- ============================================================================
-- PART 1: First, let's see what we currently have
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Current subscriptions in database:';
    FOR r IN SELECT name, description, price_monthly, price_yearly, max_jobs, max_interviews_per_month FROM public.subscriptions LOOP
        RAISE NOTICE '  %: % (monthly: $%, yearly: $%, jobs: %, interviews: %)', r.name, r.description, r.price_monthly, r.price_yearly, r.max_jobs, r.max_interviews_per_month;
    END LOOP;
END $$;

-- ============================================================================
-- PART 2: Update subscription data to match constants
-- ============================================================================

-- Update 'starter' plan to match constants
UPDATE public.subscriptions 
SET 
    description = 'Starter Plan',
    price_monthly = 99.00,
    price_yearly = 480.00, -- Updated to match constants
    max_jobs = 5, -- Updated to match constants
    max_interviews_per_month = 50, -- Updated to match constants
    features = '["AI scoring", "Interview scheduling", "Email notifications", "Email support", "48-hour response time"]'::jsonb,
    updated_at = NOW()
WHERE name = 'starter';

-- Update 'professional' to 'pro' and match constants
UPDATE public.subscriptions 
SET 
    name = 'pro',
    description = 'Pro Plan',
    price_monthly = 129.00, -- Updated to match constants
    price_yearly = 1284.00, -- Updated to match constants
    max_jobs = 20, -- Updated to match constants
    max_interviews_per_month = 200, -- Updated to match constants
    features = '["Includes starter", "Priority email & chat support", "Team collaboration tools", "Custom branding options", "24-hour response time"]'::jsonb,
    updated_at = NOW()
WHERE name = 'professional';

-- Update 'business' to match constants
UPDATE public.subscriptions 
SET 
    description = 'Business Plan',
    price_monthly = 499.00,
    price_yearly = 4790.40, -- Updated to match constants
    max_jobs = 999,
    max_interviews_per_month = 500, -- Updated to match constants
    features = '["Adds ATS integration", "Contracts", "Custom branding", "Dedicated account manager"]'::jsonb,
    updated_at = NOW()
WHERE name = 'business';

-- ============================================================================
-- PART 3: Add environment-aware Stripe fields
-- ============================================================================

-- Add new columns for environment-specific Stripe data
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_price_id_dev VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_prod VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_dev_yearly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_prod_yearly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_dev VARCHAR(500),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_prod VARCHAR(500),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_dev_yearly VARCHAR(500),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_prod_yearly VARCHAR(500);

-- ============================================================================
-- PART 4: Update Stripe data for each plan based on constants
-- ============================================================================

-- Starter Plan
UPDATE public.subscriptions 
SET 
    stripe_price_id_dev = 'price_1RmaEEED2h3xLkqttvf6IBZB',
    stripe_price_id_prod = 'price_1RmviTDKhmgOjeOsXkdKWlO6',
    stripe_price_id_dev_yearly = 'price_1Rmv6mED2h3xLkqto3zsBg1o',
    stripe_price_id_prod_yearly = 'price_1RmvoADKhmgOjeOsP9VQPBuT',
    stripe_checkout_link_dev = 'https://buy.stripe.com/test_14A8wP1mA226b5y3ui3gk05',
    stripe_checkout_link_prod = 'https://buy.stripe.com/cNi7sLcUl6J19krcicgw000',
    stripe_checkout_link_dev_yearly = 'https://buy.stripe.com/test_9B6aEX9T6bCG1uY4ym3gk06',
    stripe_checkout_link_prod_yearly = 'https://buy.stripe.com/aFa7sL2fHc3lfIPcicgw001',
    updated_at = NOW()
WHERE name = 'starter';

-- Pro Plan
UPDATE public.subscriptions 
SET 
    stripe_price_id_dev = 'price_1RmaF2ED2h3xLkqtIVi6vwBQ',
    stripe_price_id_prod = 'price_1RmvuuDKhmgOjeOsENQLZkW4',
    stripe_price_id_dev_yearly = 'price_1RmuyhED2h3xLkqt7DTYeSqV',
    stripe_price_id_prod_yearly = 'price_1Rmw0ODKhmgOjeOsM8jcRZOM',
    stripe_checkout_link_dev = 'https://buy.stripe.com/test_9B6bJ1e9m0Y2a1u2qe3gk04',
    stripe_checkout_link_prod = 'https://buy.stripe.com/dRmfZh9I95EX9kr1Dygw002',
    stripe_checkout_link_dev_yearly = 'https://buy.stripe.com/test_cNiaEX8P2ayCa1u4ym3gk01',
    stripe_checkout_link_prod_yearly = 'https://buy.stripe.com/9B68wP5rTaZh0NVcicgw003',
    updated_at = NOW()
WHERE name = 'pro';

-- Business Plan
UPDATE public.subscriptions 
SET 
    stripe_price_id_dev = 'price_1RmaFjED2h3xLkqtlPetXvuJ',
    stripe_price_id_prod = 'price_1Rmw5YDKhmgOjeOskzoCSbBt',
    stripe_price_id_dev_yearly = 'price_1RmuxMED2h3xLkqtyEUS0a6M',
    stripe_price_id_prod_yearly = 'price_1Rmw5YDKhmgOjeOskzoCSbBt',
    stripe_checkout_link_dev = 'https://buy.stripe.com/test_6oU3cv2qE9uyflOc0O3gk00',
    stripe_checkout_link_prod = 'https://buy.stripe.com/8x200j1bD6J17cj81Wgw004',
    stripe_checkout_link_dev_yearly = 'https://buy.stripe.com/test_9B68wPfdq7mqa1u8OC3gk03',
    stripe_checkout_link_prod_yearly = 'https://buy.stripe.com/bJedR92fH7N59kr0zugw005',
    updated_at = NOW()
WHERE name = 'business';

-- ============================================================================
-- PART 5: Remove unused fields that are no longer needed
-- ============================================================================

-- Remove the old stripe_price_id field since we now have environment-specific ones
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS stripe_price_id;

-- ============================================================================
-- PART 6: Create helper functions for environment-aware Stripe data
-- ============================================================================

-- Function to get the appropriate Stripe price ID based on environment
CREATE OR REPLACE FUNCTION get_stripe_price_id(
    subscription_name TEXT,
    environment TEXT DEFAULT 'development',
    billing_period TEXT DEFAULT 'monthly'
)
RETURNS TEXT AS $$
DECLARE
    price_id TEXT;
BEGIN
    IF environment = 'production' THEN
        IF billing_period = 'yearly' THEN
            SELECT stripe_price_id_prod_yearly INTO price_id
            FROM public.subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_price_id_prod INTO price_id
            FROM public.subscriptions
            WHERE name = subscription_name;
        END IF;
    ELSE
        IF billing_period = 'yearly' THEN
            SELECT stripe_price_id_dev_yearly INTO price_id
            FROM public.subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_price_id_dev INTO price_id
            FROM public.subscriptions
            WHERE name = subscription_name;
        END IF;
    END IF;
    
    RETURN price_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get the appropriate Stripe checkout link based on environment
CREATE OR REPLACE FUNCTION get_stripe_checkout_link(
    subscription_name TEXT,
    environment TEXT DEFAULT 'development',
    billing_period TEXT DEFAULT 'monthly'
)
RETURNS TEXT AS $$
DECLARE
    checkout_link TEXT;
BEGIN
    IF environment = 'production' THEN
        IF billing_period = 'yearly' THEN
            SELECT stripe_checkout_link_prod_yearly INTO checkout_link
            FROM public.subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_checkout_link_prod INTO checkout_link
            FROM public.subscriptions
            WHERE name = subscription_name;
        END IF;
    ELSE
        IF billing_period = 'yearly' THEN
            SELECT stripe_checkout_link_dev_yearly INTO checkout_link
            FROM public.subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_checkout_link_dev INTO checkout_link
            FROM public.subscriptions
            WHERE name = subscription_name;
        END IF;
    END IF;
    
    RETURN checkout_link;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: Update the user_details view to use the new structure
-- ============================================================================

-- Drop and recreate the user_details view to include new fields
DROP VIEW IF EXISTS public.user_details;

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
    us.expires_at as subscription_expires_at,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    
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
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id;

-- Grant access to the view
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role;

-- ============================================================================
-- PART 8: Verification and cleanup
-- ============================================================================

-- Verify the changes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Check that we have the correct subscription names
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE name = 'starter') THEN
        RAISE EXCEPTION 'Starter subscription not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE name = 'pro') THEN
        RAISE EXCEPTION 'Pro subscription not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE name = 'business') THEN
        RAISE EXCEPTION 'Business subscription not found';
    END IF;
    
    -- Check that Stripe data is populated
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE stripe_price_id_dev IS NOT NULL) THEN
        RAISE EXCEPTION 'Stripe development price IDs not populated';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE stripe_price_id_prod IS NOT NULL) THEN
        RAISE EXCEPTION 'Stripe production price IDs not populated';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Database now aligned with constants file';
    RAISE NOTICE 'Environment-aware Stripe functions created';
    RAISE NOTICE 'Updated subscriptions:';
    
    FOR r IN SELECT name, price_monthly, price_yearly, max_jobs, max_interviews_per_month FROM public.subscriptions WHERE name IN ('starter', 'pro', 'business') ORDER BY price_monthly LOOP
        RAISE NOTICE '  %: $% monthly, $% yearly, % jobs, % interviews/month', r.name, r.price_monthly, r.price_yearly, r.max_jobs, r.max_interviews_per_month;
    END LOOP;
END $$; 