-- 00143_profiles_rls_current_company_function.sql
-- Add helper to fetch current user's company id (security definer) and simplify profiles RLS

SET search_path = public;

-- Helper function: current_company_id
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_company_id() TO anon;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO service_role;

-- Recreate profiles SELECT policies using the helper to avoid recursive RLS issues
DROP POLICY IF EXISTS "Company members can view company profiles" ON public.profiles;
CREATE POLICY "Company members can view company profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (company_id IS NOT NULL AND company_id = public.current_company_id())
    OR (id = auth.uid())
  );

-- Ensure self-view policy exists (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  TO public
  USING (auth.uid() = id); 