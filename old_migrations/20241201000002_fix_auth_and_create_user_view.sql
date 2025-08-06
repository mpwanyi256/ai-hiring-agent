-- Fix authentication issues and create user view
-- This migration addresses RLS policy issues and creates a comprehensive user view

-- Drop the trigger first (which depends on the function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop existing functions
DROP FUNCTION IF EXISTS generate_company_slug(TEXT);
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function to generate company slug with proper security
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_company_slug(TEXT) TO service_role;

-- Recreate the user signup handler with proper security
CREATE OR REPLACE FUNCTION handle_new_user()
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
        VALUES (company_name, generate_company_slug(company_name))
        RETURNING id INTO new_company_id;
        
        existing_company_id := new_company_id;
    END IF;
    
    -- Create user profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        company_id
    ) VALUES (
        NEW.id,
        NEW.email,
        company_data->>'first_name',
        company_data->>'last_name',
        existing_company_id
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

-- Grant execute permission on the trigger function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update RLS policies to allow inserts from the trigger function
-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;

-- Create new RLS policies that allow both authenticated users and service role
CREATE POLICY "Enable profile access" ON public.profiles
    FOR ALL USING (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Enable company access" ON public.companies
    FOR ALL USING (
        id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Enable user subscription access" ON public.user_subscriptions
    FOR ALL USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Create a comprehensive user view with subscription details
CREATE OR REPLACE VIEW user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
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
    
    -- Usage counts (will be useful for billing)
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

-- Create RLS policy for the view
ALTER VIEW user_details SET (security_invoker = on);

-- Additional policies for jobs, candidates, responses, and evaluations to work with the new setup
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view candidates for their jobs" ON public.candidates;
DROP POLICY IF EXISTS "Users can view responses for their job candidates" ON public.responses;
DROP POLICY IF EXISTS "Users can view evaluations for their job candidates" ON public.evaluations;

CREATE POLICY "Enable job access" ON public.jobs
    FOR ALL USING (
        profile_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Enable candidate access" ON public.candidates
    FOR ALL USING (
        job_id IN (SELECT id FROM public.jobs WHERE profile_id = auth.uid()) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Enable response access" ON public.responses
    FOR ALL USING (
        candidate_id IN (
            SELECT c.id FROM public.candidates c
            JOIN public.jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        ) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Enable evaluation access" ON public.evaluations
    FOR ALL USING (
        candidate_id IN (
            SELECT c.id FROM public.candidates c
            JOIN public.jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        ) OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Allow anonymous users to create candidates and responses for the interview flow
CREATE POLICY "Allow anonymous candidate creation" ON public.candidates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous response creation" ON public.responses
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to select jobs by interview token
CREATE POLICY "Allow anonymous job access by token" ON public.jobs
    FOR SELECT USING (true);

-- Grant necessary permissions to anonymous for interview flow
GRANT SELECT ON public.jobs TO anon;
GRANT INSERT ON public.candidates TO anon;
GRANT INSERT ON public.responses TO anon;

-- Ensure service_role has full access to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role; 