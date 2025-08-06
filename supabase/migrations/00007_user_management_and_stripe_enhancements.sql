-- User Management and Stripe Enhancements Migration
-- This migration adds user signup handling, environment-aware Stripe fields, and missing subscription features

-- Add environment-aware Stripe fields to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_price_id_dev VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_prod VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_dev_yearly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_prod_yearly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_dev VARCHAR(500),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_prod VARCHAR(500),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_dev_yearly VARCHAR(500),
ADD COLUMN IF NOT EXISTS stripe_checkout_link_prod_yearly VARCHAR(500);

-- Create function to generate company slugs in camelCase format
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
    words TEXT[];
    word TEXT;
    camel_case_slug TEXT := '';
    i INTEGER;
BEGIN
    -- Convert to lowercase and replace special chars with spaces
    base_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9\s]', ' ', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', ' ', 'g');
    base_slug := trim(both ' ' from base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'company';
    END IF;
    
    -- Split into words
    words := string_to_array(base_slug, ' ');
    
    -- Convert to camelCase
    FOR i IN 1..array_length(words, 1) LOOP
        word := words[i];
        IF i = 1 THEN
            -- First word stays lowercase
            camel_case_slug := word;
        ELSE
            -- Subsequent words are capitalized
            camel_case_slug := camel_case_slug || initcap(word);
        END IF;
    END LOOP;
    
    final_slug := camel_case_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := camel_case_slug || counter::TEXT;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_data JSONB;
    company_name TEXT;
    invite_id TEXT;
    user_role TEXT;
    existing_company_id UUID;
    new_company_id UUID;
    free_subscription_id UUID;
BEGIN
    -- Extract data from user metadata
    company_data := NEW.raw_user_meta_data;
    company_name := company_data->>'company_name';
    invite_id := company_data->>'invite_id';
    user_role := company_data->>'role';
    
    -- Check if company name was provided
    IF company_name IS NULL OR company_name = '' THEN
        RAISE EXCEPTION 'Company name is required in user metadata';
    END IF;
    
    -- Handle invited users
    IF invite_id IS NOT NULL THEN
        -- Get company_id from the invite
        SELECT company_id INTO existing_company_id 
        FROM invites 
        WHERE id = invite_id::uuid;
        
        IF existing_company_id IS NULL THEN
            RAISE EXCEPTION 'Invalid invite ID';
        END IF;
        
        -- Mark invite as accepted
        UPDATE invites 
        SET status = 'accepted', updated_at = NOW()
        WHERE id = invite_id::uuid;
        
    ELSE
        -- Handle regular signup (company creation)
        -- Check if company already exists (case-insensitive)
        SELECT id INTO existing_company_id 
        FROM companies 
        WHERE lower(name) = lower(company_name);
        
        -- If company doesn't exist, create it
        IF existing_company_id IS NULL THEN
            INSERT INTO companies (name, slug)
            VALUES (company_name, generate_company_slug(company_name))
            RETURNING id INTO new_company_id;
            
            existing_company_id := new_company_id;
        END IF;
    END IF;
    
    -- Create user profile with appropriate role
    INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        company_id,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        company_data->>'first_name',
        company_data->>'last_name',
        existing_company_id,
        COALESCE(user_role, 'employer')
    );
    
    -- Only assign free subscription for new company creators (not invited users)
    IF invite_id IS NULL THEN
        -- Get free subscription ID
        SELECT id INTO free_subscription_id 
        FROM subscriptions 
        WHERE name = 'free';
        
        -- Subscribe user to free tier
        IF free_subscription_id IS NOT NULL THEN
            INSERT INTO user_subscriptions (
                profile_id,
                subscription_id,
                status
            ) VALUES (
                NEW.id,
                free_subscription_id,
                'active'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign free subscription
CREATE OR REPLACE FUNCTION assign_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
    free_subscription_id UUID;
BEGIN
    -- Get free subscription ID
    SELECT id INTO free_subscription_id 
    FROM subscriptions 
    WHERE name = 'free';
    
    -- Only assign if user doesn't have a subscription
    IF free_subscription_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM user_subscriptions WHERE profile_id = NEW.id
    ) THEN
        INSERT INTO user_subscriptions (
            profile_id,
            subscription_id,
            status,
            started_at
        ) VALUES (
            NEW.id,
            free_subscription_id,
            'active',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
    p_profile_id UUID,
    p_limit_type TEXT, -- 'jobs', 'interviews', 'candidates'
    p_current_count INTEGER DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_limits JSONB;
    max_allowed INTEGER;
    monthly_count INTEGER;
BEGIN
    -- Get user's subscription limits
    SELECT s.limits INTO subscription_limits
    FROM user_subscriptions us
    JOIN subscriptions s ON us.subscription_id = s.id
    WHERE us.profile_id = p_profile_id AND us.status = 'active'
    LIMIT 1;
    
    -- If no subscription found, return false
    IF subscription_limits IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check specific limits
    CASE p_limit_type
        WHEN 'jobs' THEN
            max_allowed := (subscription_limits->>'max_jobs')::INTEGER;
            IF max_allowed = -1 THEN RETURN TRUE; END IF; -- Unlimited
            RETURN p_current_count < max_allowed;
            
        WHEN 'interviews' THEN
            max_allowed := (subscription_limits->>'max_interviews_per_month')::INTEGER;
            IF max_allowed = -1 THEN RETURN TRUE; END IF; -- Unlimited
            
            -- Count interviews this month for the user
            SELECT COUNT(*) INTO monthly_count
            FROM interviews i
            JOIN jobs j ON i.job_id = j.id
            WHERE j.profile_id = p_profile_id
            AND EXTRACT(YEAR FROM i.created_at) = EXTRACT(YEAR FROM NOW())
            AND EXTRACT(MONTH FROM i.created_at) = EXTRACT(MONTH FROM NOW());
            
            RETURN monthly_count < max_allowed;
            
        WHEN 'candidates' THEN
            max_allowed := (subscription_limits->>'candidates_per_job')::INTEGER;
            IF max_allowed = -1 THEN RETURN TRUE; END IF; -- Unlimited
            RETURN p_current_count < max_allowed;
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create functions for environment-aware Stripe data
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
            FROM subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_price_id_prod INTO price_id
            FROM subscriptions
            WHERE name = subscription_name;
        END IF;
    ELSE
        IF billing_period = 'yearly' THEN
            SELECT stripe_price_id_dev_yearly INTO price_id
            FROM subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_price_id_dev INTO price_id
            FROM subscriptions
            WHERE name = subscription_name;
        END IF;
    END IF;
    
    RETURN price_id;
END;
$$ LANGUAGE plpgsql;

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
            FROM subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_checkout_link_prod INTO checkout_link
            FROM subscriptions
            WHERE name = subscription_name;
        END IF;
    ELSE
        IF billing_period = 'yearly' THEN
            SELECT stripe_checkout_link_dev_yearly INTO checkout_link
            FROM subscriptions
            WHERE name = subscription_name;
        ELSE
            SELECT stripe_checkout_link_dev INTO checkout_link
            FROM subscriptions
            WHERE name = subscription_name;
        END IF;
    END IF;
    
    RETURN checkout_link;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user subscription details
CREATE OR REPLACE FUNCTION get_user_subscription_details(p_profile_id UUID)
RETURNS TABLE (
    subscription_name TEXT,
    description TEXT,
    features JSONB,
    limits JSONB,
    status TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    is_trial BOOLEAN,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name as subscription_name,
        s.description,
        s.features,
        s.limits,
        us.status,
        us.current_period_start,
        us.current_period_end,
        CASE WHEN us.trial_end > NOW() THEN TRUE ELSE FALSE END as is_trial,
        CASE 
            WHEN us.trial_end > NOW() THEN EXTRACT(DAYS FROM us.trial_end - NOW())::INTEGER
            WHEN us.current_period_end > NOW() THEN EXTRACT(DAYS FROM us.current_period_end - NOW())::INTEGER
            ELSE 0
        END as days_remaining
    FROM user_subscriptions us
    JOIN subscriptions s ON us.subscription_id = s.id
    WHERE us.profile_id = p_profile_id
    AND us.status IN ('active', 'trialing')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enhanced view for company subscription details
CREATE OR REPLACE VIEW company_subscription_details AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    
    -- Subscription info
    s.name as subscription_name,
    s.description as subscription_description,
    s.price_monthly,
    s.price_yearly,
    s.features,
    s.limits,
    
    -- User subscription details
    us.status as subscription_status,
    us.current_period_start,
    us.current_period_end,
    us.trial_start,
    us.trial_end,
    
    -- Usage metrics
    COALESCE(job_counts.job_count, 0) as jobs_used,
    COALESCE(interview_counts.interview_count, 0) as interviews_this_month,
    
    -- Limits
    (s.limits->>'max_jobs')::INTEGER as max_jobs,
    (s.limits->>'max_interviews_per_month')::INTEGER as max_interviews_per_month,
    
    -- Stripe data (environment-aware)
    s.stripe_price_id_dev,
    s.stripe_price_id_prod,
    s.stripe_price_id_dev_yearly,
    s.stripe_price_id_prod_yearly,
    s.stripe_checkout_link_dev,
    s.stripe_checkout_link_prod,
    s.stripe_checkout_link_dev_yearly,
    s.stripe_checkout_link_prod_yearly,
    
    -- Profile details
    p.id as profile_id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    
    us.created_at as subscription_created_at,
    us.updated_at as subscription_updated_at

FROM companies c
LEFT JOIN profiles p ON c.id = p.company_id
LEFT JOIN user_subscriptions us ON p.id = us.profile_id
LEFT JOIN subscriptions s ON us.subscription_id = s.id
LEFT JOIN (
    SELECT 
        p.company_id,
        COUNT(j.id) as job_count
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    GROUP BY p.company_id
) job_counts ON c.id = job_counts.company_id
LEFT JOIN (
    SELECT 
        p.company_id,
        COUNT(i.id) as interview_count
    FROM interviews i
    JOIN jobs j ON i.job_id = j.id
    JOIN profiles p ON j.profile_id = p.id
    WHERE EXTRACT(YEAR FROM i.created_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM i.created_at) = EXTRACT(MONTH FROM NOW())
    GROUP BY p.company_id
) interview_counts ON c.id = interview_counts.company_id;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update Stripe environment data for existing subscriptions
UPDATE subscriptions SET
    stripe_price_id_dev = 'price_dev_free_monthly',
    stripe_price_id_prod = 'price_prod_free_monthly',
    stripe_price_id_dev_yearly = 'price_dev_free_yearly',
    stripe_price_id_prod_yearly = 'price_prod_free_yearly',
    stripe_checkout_link_dev = 'https://billing.stripe.com/p/login/test_dev_free',
    stripe_checkout_link_prod = 'https://billing.stripe.com/p/login/prod_free',
    stripe_checkout_link_dev_yearly = 'https://billing.stripe.com/p/login/test_dev_free_yearly',
    stripe_checkout_link_prod_yearly = 'https://billing.stripe.com/p/login/prod_free_yearly'
WHERE name = 'free';

UPDATE subscriptions SET
    stripe_price_id_dev = 'price_dev_pro_monthly',
    stripe_price_id_prod = 'price_prod_pro_monthly',
    stripe_price_id_dev_yearly = 'price_dev_pro_yearly',
    stripe_price_id_prod_yearly = 'price_prod_pro_yearly',
    stripe_checkout_link_dev = 'https://billing.stripe.com/p/login/test_dev_pro',
    stripe_checkout_link_prod = 'https://billing.stripe.com/p/login/prod_pro',
    stripe_checkout_link_dev_yearly = 'https://billing.stripe.com/p/login/test_dev_pro_yearly',
    stripe_checkout_link_prod_yearly = 'https://billing.stripe.com/p/login/prod_pro_yearly'
WHERE name = 'pro';

UPDATE subscriptions SET
    stripe_price_id_dev = 'price_dev_business_monthly',
    stripe_price_id_prod = 'price_prod_business_monthly',
    stripe_price_id_dev_yearly = 'price_dev_business_yearly',
    stripe_price_id_prod_yearly = 'price_prod_business_yearly',
    stripe_checkout_link_dev = 'https://billing.stripe.com/p/login/test_dev_business',
    stripe_checkout_link_prod = 'https://billing.stripe.com/p/login/prod_business',
    stripe_checkout_link_dev_yearly = 'https://billing.stripe.com/p/login/test_dev_business_yearly',
    stripe_checkout_link_prod_yearly = 'https://billing.stripe.com/p/login/prod_business_yearly'
WHERE name = 'business';

UPDATE subscriptions SET
    stripe_price_id_dev = 'price_dev_enterprise_monthly',
    stripe_price_id_prod = 'price_prod_enterprise_monthly',
    stripe_price_id_dev_yearly = 'price_dev_enterprise_yearly',
    stripe_price_id_prod_yearly = 'price_prod_enterprise_yearly',
    stripe_checkout_link_dev = 'https://billing.stripe.com/p/login/test_dev_enterprise',
    stripe_checkout_link_prod = 'https://billing.stripe.com/p/login/prod_enterprise',
    stripe_checkout_link_dev_yearly = 'https://billing.stripe.com/p/login/test_dev_enterprise_yearly',
    stripe_checkout_link_prod_yearly = 'https://billing.stripe.com/p/login/prod_enterprise_yearly'
WHERE name = 'enterprise';

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO postgres;

GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;

GRANT EXECUTE ON FUNCTION assign_free_subscription() TO service_role;
GRANT EXECUTE ON FUNCTION assign_free_subscription() TO authenticated;

GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, TEXT, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION get_stripe_price_id(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stripe_checkout_link(TEXT, TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_subscription_details(UUID) TO authenticated;

-- Grant permissions to views
GRANT SELECT ON company_subscription_details TO authenticated; 