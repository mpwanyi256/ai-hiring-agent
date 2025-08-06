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