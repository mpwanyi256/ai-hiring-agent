-- Fix user_role type creation and simplify function
-- This migration ensures the user_role enum is properly created and removes redundant code

-- Drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the enum type if it exists and recreate it properly
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Create user_role enum type with explicit schema
CREATE TYPE public.user_role AS ENUM ('recruiter', 'candidate', 'admin', 'developer');

-- Ensure role column exists in profiles table with proper type
DO $$ 
BEGIN
    -- Check if column exists and drop it if it does (to recreate with proper type)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles DROP COLUMN role;
    END IF;
    
    -- Add column with proper type and default
    ALTER TABLE public.profiles 
    ADD COLUMN role public.user_role DEFAULT 'recruiter'::public.user_role NOT NULL;
END $$;

-- Recreate the simplified handle_new_user function
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
    
    -- Create user profile (role will default to 'recruiter')
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

-- Grant proper permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant usage on the enum type
GRANT USAGE ON TYPE public.user_role TO service_role;
GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT USAGE ON TYPE public.user_role TO anon;

-- Recreate the user_details view to ensure it works with the new type
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
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role;

-- Comment to explain the changes
COMMENT ON FUNCTION public.handle_new_user() IS 'Simplified function that creates company and user profile. Role defaults to recruiter automatically.';
COMMENT ON TYPE public.user_role IS 'User role enum: recruiter (default), candidate, admin, developer'; 