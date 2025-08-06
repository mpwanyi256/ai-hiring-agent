-- Fix handle_new_user function and remove free subscription
-- This migration fixes schema qualification issues and removes free subscription functionality

-- First, remove all user subscriptions that are using the free plan
DELETE FROM public.user_subscriptions 
WHERE subscription_id IN (
    SELECT id FROM public.subscriptions WHERE name = 'free'
);

-- Delete the free subscription plan from the database
DELETE FROM public.subscriptions WHERE name = 'free';

-- Drop and recreate the handle_new_user function without free subscription logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_data JSONB;
    company_name TEXT;
    invite_id TEXT;
    user_role TEXT;
    existing_company_id UUID;
    new_company_id UUID;
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
        -- Get company_id from the invite (properly qualify schema)
        SELECT company_id INTO existing_company_id 
        FROM public.invites 
        WHERE id = invite_id::uuid;
        
        IF existing_company_id IS NULL THEN
            RAISE EXCEPTION 'Invalid invite ID';
        END IF;
        
        -- Mark invite as accepted (properly qualify schema)
        UPDATE public.invites 
        SET status = 'accepted', updated_at = NOW()
        WHERE id = invite_id::uuid;
        
    ELSE
        -- Handle regular signup (company creation)
        -- Check if company already exists (case-insensitive, properly qualify schema)
        SELECT id INTO existing_company_id 
        FROM public.companies 
        WHERE lower(name) = lower(company_name);
        
        -- If company doesn't exist, create it (properly qualify schema)
        IF existing_company_id IS NULL THEN
            INSERT INTO public.companies (name, slug)
            VALUES (company_name, public.generate_company_slug(company_name))
            RETURNING id INTO new_company_id;
            
            existing_company_id := new_company_id;
        END IF;
    END IF;
    
    -- Create user profile with appropriate role (properly qualify schema)
    INSERT INTO public.profiles (
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
    
    -- Note: No subscription assignment - users will start trial periods when they select a plan
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the assign_free_subscription function as it's no longer needed
DROP FUNCTION IF EXISTS assign_free_subscription();

-- Update the check_subscription_limit function to handle users without subscriptions
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
    FROM public.user_subscriptions us
    JOIN public.subscriptions s ON us.subscription_id = s.id
    WHERE us.profile_id = p_profile_id AND us.status IN ('active', 'trialing')
    LIMIT 1;
    
    -- If no subscription found, user is in evaluation mode with basic limits
    IF subscription_limits IS NULL THEN
        -- Basic limits for users without subscriptions (evaluation period)
        CASE p_limit_type
            WHEN 'jobs' THEN
                RETURN p_current_count < 1; -- 1 job during evaluation
            WHEN 'interviews' THEN
                RETURN p_current_count < 3; -- 3 interviews during evaluation
            WHEN 'candidates' THEN
                RETURN p_current_count < 5; -- 5 candidates per job during evaluation
            ELSE
                RETURN FALSE;
        END CASE;
    END IF;
    
    -- Check specific limits for subscribed users
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
            FROM public.interviews i
            JOIN public.jobs j ON i.job_id = j.id
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

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, TEXT, INTEGER) TO service_role;

-- Update comments
COMMENT ON FUNCTION handle_new_user() IS 
'Handle new user signup - creates profile and company, no automatic subscription assignment';

COMMENT ON FUNCTION check_subscription_limit(UUID, TEXT, INTEGER) IS 
'Check subscription limits - users without subscriptions get basic evaluation limits'; 