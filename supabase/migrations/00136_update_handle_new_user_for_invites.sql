-- 00136_update_handle_new_user_for_invites.sql
-- Fix invited user signup flow to avoid exceptions when company_name is absent
-- and properly accept invites by linking profiles to the invite's company.

SET search_path = public;

-- Replace handle_new_user to support invite-based signups without requiring company_name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_data JSONB;
  company_name TEXT;
  invite_id TEXT;
  user_role TEXT;
  existing_company_id UUID;
  new_company_id UUID;
  invited_role TEXT;
BEGIN
  -- Extract metadata
  company_data := NEW.raw_user_meta_data;
  company_name := company_data->>'company_name';
  invite_id := COALESCE(company_data->>'invite_id', company_data->>'invitation_id');
  user_role := company_data->>'role';

  IF invite_id IS NOT NULL AND invite_id <> '' THEN
    -- Use company from invite; also fetch role if present
    SELECT company_id, role INTO existing_company_id, invited_role
    FROM public.invites
    WHERE id = invite_id::uuid;

    IF existing_company_id IS NULL THEN
      RAISE EXCEPTION 'Invalid invite ID';
    END IF;

    -- Mark invite accepted
    UPDATE public.invites
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invite_id::uuid;

  ELSE
    -- Regular signup requires a company name
    IF company_name IS NULL OR company_name = '' THEN
      RAISE EXCEPTION 'Company name is required in user metadata';
    END IF;

    -- Find or create company
    SELECT id INTO existing_company_id
    FROM public.companies
    WHERE lower(name) = lower(company_name);

    IF existing_company_id IS NULL THEN
      INSERT INTO public.companies (name, slug)
      VALUES (company_name, public.generate_company_slug(company_name))
      RETURNING id INTO new_company_id;

      existing_company_id := new_company_id;
    END IF;
  END IF;

  -- Create user profile under the resolved company
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
    COALESCE(user_role, invited_role, 'employer')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres; 