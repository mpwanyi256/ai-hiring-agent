-- 00137_update_profiles_role_check.sql
-- Extend profiles.role allowed values to include 'recruiter'

SET search_path = public;

-- Drop existing role check constraint if it exists
ALTER TABLE public.profiles
	DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Recreate role check to include recruiter
ALTER TABLE public.profiles
	ADD CONSTRAINT profiles_role_check
	CHECK (role IN ('admin', 'employer', 'candidate', 'recruiter'));

-- Keep default as employer (no-op if already set)
ALTER TABLE public.profiles
	ALTER COLUMN role SET DEFAULT 'employer'; 