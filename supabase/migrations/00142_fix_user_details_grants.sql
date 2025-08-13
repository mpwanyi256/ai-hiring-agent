-- 00142_fix_user_details_grants.sql
-- Ensure PostgREST (authenticator) can prepare statements against user_details

SET search_path = public;

-- Ensure roles can use schema
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on the view to all relevant roles
GRANT SELECT ON public.user_details TO authenticator;
GRANT SELECT ON public.user_details TO anon;
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role; 