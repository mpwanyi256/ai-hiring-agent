-- Migration: Handle invite signup flow
-- This migration updates the handle_new_user function to properly handle invited users

-- Drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function with invite handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
        FROM public.invites 
        WHERE id = invite_id::uuid;
        
        IF existing_company_id IS NULL THEN
            RAISE EXCEPTION 'Invalid invite ID';
        END IF;
        
        -- Mark invite as accepted
        UPDATE public.invites 
        SET status = 'accepted', updated_at = NOW()
        WHERE id = invite_id::uuid;
        
    ELSE
        -- Handle regular signup (company creation)
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
    END IF;
    
    -- Create user profile with appropriate role
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
        COALESCE(user_role, 'recruiter')::public.user_role
    );
    
    -- Only assign free subscription for new company creators (not invited users)
    IF invite_id IS NULL THEN
        -- Get free subscription ID
        SELECT id INTO free_subscription_id 
        FROM public.subscriptions 
        WHERE name = 'free';
        
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

-- Add updated_at column to invites table if it doesn't exist
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invites_updated_at ON public.invites;
CREATE TRIGGER update_invites_updated_at
    BEFORE UPDATE ON public.invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 