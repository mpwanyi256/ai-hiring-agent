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


-- Moving migration 00010 here

-- Comprehensive Account Creation Fix Migration
-- This migration fixes all schema qualification issues for user account creation

-- Fix the generate_company_slug function with proper schema qualification
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
    
    -- Check for uniqueness and append number if needed (FIXED: properly qualify schema)
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := camel_case_slug || counter::TEXT;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function with all schema qualifications and error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_data JSONB;
    company_name TEXT;
    invite_id TEXT;
    user_role TEXT;
    existing_company_id UUID;
    new_company_id UUID;
    generated_slug TEXT;
BEGIN
    -- Extract data from user metadata
    company_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    company_name := company_data->>'company_name';
    invite_id := company_data->>'invite_id';
    user_role := company_data->>'role';
    
    -- Provide default company name if missing
    IF company_name IS NULL OR company_name = '' THEN
        company_name := 'My Company';
    END IF;
    
    -- Handle invited users
    IF invite_id IS NOT NULL AND invite_id != '' THEN
        BEGIN
            -- Get company_id from the invite (properly qualify schema)
            SELECT company_id INTO existing_company_id 
            FROM public.invites 
            WHERE id = invite_id::uuid AND status = 'pending';
            
            IF existing_company_id IS NOT NULL THEN
                -- Mark invite as accepted (properly qualify schema)
                UPDATE public.invites 
                SET status = 'accepted', updated_at = NOW()
                WHERE id = invite_id::uuid;
            ELSE
                -- If invite not found or expired, treat as regular signup
                existing_company_id := NULL;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- If invite handling fails, continue with regular signup
                existing_company_id := NULL;
        END;
    END IF;
    
    -- Handle regular signup or failed invite (company creation)
    IF existing_company_id IS NULL THEN
        BEGIN
            -- Check if company already exists (case-insensitive, properly qualify schema)
            SELECT id INTO existing_company_id 
            FROM public.companies 
            WHERE lower(name) = lower(company_name)
            LIMIT 1;
            
            -- If company doesn't exist, create it (properly qualify schema)
            IF existing_company_id IS NULL THEN
                -- Generate slug safely
                generated_slug := public.generate_company_slug(company_name);
                
                INSERT INTO public.companies (name, slug)
                VALUES (company_name, generated_slug)
                RETURNING id INTO new_company_id;
                
                existing_company_id := new_company_id;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Failed to create or find company: %', SQLERRM;
        END;
    END IF;
    
    -- Create user profile with appropriate role (properly qualify schema)
    BEGIN
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
            COALESCE(company_data->>'first_name', ''),
            COALESCE(company_data->>'last_name', ''),
            existing_company_id,
            COALESCE(user_role, 'employer')
        );
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
    END;
    
    -- Note: No subscription assignment - users will start with evaluation limits
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise with context
        RAISE EXCEPTION 'User creation failed for email %: %', NEW.email, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to validate user metadata
CREATE OR REPLACE FUNCTION validate_user_metadata(metadata JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic validation
    IF metadata IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check for required fields (company_name is now optional with default)
    -- We can be flexible here since we provide defaults
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with proper error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions to all functions
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO postgres;

GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;

GRANT EXECUTE ON FUNCTION validate_user_metadata(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_metadata(JSONB) TO service_role;

-- Update function comments
COMMENT ON FUNCTION generate_company_slug(TEXT) IS 
'Generate unique camelCase company slug with proper schema qualification';

COMMENT ON FUNCTION handle_new_user() IS 
'Handle new user signup with comprehensive error handling and schema qualification';

COMMENT ON FUNCTION validate_user_metadata(JSONB) IS 
'Validate user metadata for signup process';

-- Ensure all tables have proper permissions for the auth admin user
GRANT SELECT, INSERT, UPDATE ON public.companies TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO supabase_auth_admin;
GRANT SELECT, UPDATE ON public.invites TO supabase_auth_admin;
GRANT SELECT ON public.subscriptions TO supabase_auth_admin;
GRANT SELECT, INSERT ON public.user_subscriptions TO supabase_auth_admin; 
