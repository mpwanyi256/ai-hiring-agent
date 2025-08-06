-- Ensure user_role type exists and fix any missing elements
-- This migration ensures the user_role enum type is properly created

-- Create user_role type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('recruiter', 'candidate', 'admin', 'developer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if role column exists in profiles table, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role user_role DEFAULT 'recruiter' NOT NULL;
    END IF;
END $$;

-- Ensure the generate_company_slug function exists with proper permissions
CREATE OR REPLACE FUNCTION public.generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'company';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.generate_company_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_company_slug(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_company_slug(TEXT) TO postgres;

-- Recreate the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_data JSONB;
    company_name TEXT;
    existing_company_id UUID;
    new_company_id UUID;
    free_subscription_id UUID;
BEGIN
    -- Extract company name from user metadata
    company_data := NEW.raw_user_meta_data;
    company_name := company_data->>'company_name';
    
    -- Check if company name was provided
    IF company_name IS NULL OR company_name = '' THEN
        RAISE EXCEPTION 'Company name is required in user metadata';
    END IF;
    
    -- Check if company already exists (case-insensitive)
    SELECT id INTO existing_company_id 
    FROM public.companies 
    WHERE lower(name) = lower(company_name);
    
    -- If company doesn't exist, create it
    IF existing_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug)
        VALUES (company_name, public.generate_company_slug(company_name))
        RETURNING id INTO new_company_id;
        
        existing_company_id := new_company_id;
    END IF;
    
    -- Create user profile with default recruiter role
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
        'recruiter'::user_role
    );
    
    -- Get free subscription ID
    SELECT id INTO free_subscription_id 
    FROM public.subscriptions 
    WHERE name = 'free' AND is_active = true;
    
    -- Subscribe user to free tier
    IF free_subscription_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (
            user_id,
            subscription_id,
            status
        ) VALUES (
            NEW.id,
            free_subscription_id,
            'active'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant proper permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper RLS policies exist
-- Drop existing policies first
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_update_policy" ON public.user_subscriptions;

-- Create comprehensive RLS policies
-- Profiles policies
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.uid() = id
    );

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Companies policies
CREATE POLICY "companies_select_policy" ON public.companies
    FOR SELECT USING (
        id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "companies_insert_policy" ON public.companies
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "companies_update_policy" ON public.companies
    FOR UPDATE USING (
        id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- User subscriptions policies
CREATE POLICY "user_subscriptions_select_policy" ON public.user_subscriptions
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR
        user_id = auth.uid()
    );

CREATE POLICY "user_subscriptions_update_policy" ON public.user_subscriptions
    FOR UPDATE USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Recreate the user_details view
DROP VIEW IF EXISTS user_details;

CREATE OR REPLACE VIEW user_details AS
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
    
    -- Subscription details
    s.id as subscription_id,
    s.name as subscription_name,
    s.description as subscription_description,
    s.price_monthly,
    s.price_yearly,
    s.max_jobs,
    s.max_interviews_per_month,
    s.features as subscription_features,
    
    -- User subscription status
    us.status as subscription_status,
    us.started_at as subscription_started_at,
    us.expires_at as subscription_expires_at,
    
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
GRANT SELECT ON user_details TO authenticated;
GRANT SELECT ON user_details TO service_role;

-- Ensure service_role has comprehensive access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant necessary permissions for the trigger to work
GRANT USAGE ON TYPE user_role TO service_role;
GRANT USAGE ON TYPE user_role TO authenticated; 