-- 00150_update_job_permissions_check.sql
-- Align job_permissions.permission_level CHECK with app values

SET search_path = public;

-- Drop legacy check constraint if present
ALTER TABLE public.job_permissions
  DROP CONSTRAINT IF EXISTS job_permissions_permission_type_check;

-- Recreate check with current levels used by the app
ALTER TABLE public.job_permissions
  ADD CONSTRAINT job_permissions_permission_level_check
  CHECK (permission_level IN ('viewer','interviewer','manager','admin')); 