-- Drop existing problematic view since we're using direct JOINs in the API
DROP VIEW IF EXISTS public.job_permissions_detailed CASCADE; 