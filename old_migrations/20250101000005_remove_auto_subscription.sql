-- Remove automatic subscription logic from handle_new_user function
-- This migration removes the automatic free tier subscription since we now have Stripe integration

-- Drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function WITHOUT automatic subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_data JSONB;
    company_name TEXT;
    existing_company_id UUID;
    new_company_id UUID;
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
    
    -- NOTE: Removed automatic subscription logic
    -- Users will now need to choose a plan through Stripe checkout
    -- No automatic free tier subscription is created
    
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

-- Add comment to explain the changes
COMMENT ON FUNCTION public.handle_new_user() IS 'Function that creates company and user profile. No automatic subscription - users must choose a plan through Stripe checkout.'; 