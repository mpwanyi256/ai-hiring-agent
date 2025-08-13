-- 00135_relax_invites_role_and_extend_status_values.sql
-- Fix check constraint violations when inserting invites by relaxing role constraint
-- and extending allowed status values.

SET search_path = public;

-- Ensure invited_by keeps default to current user (no-op if already set)
ALTER TABLE public.invites
	ALTER COLUMN invited_by SET DEFAULT auth.uid();

-- Drop strict role check constraint if present to allow flexible roles managed at app level
ALTER TABLE public.invites
	DROP CONSTRAINT IF EXISTS invites_role_check;

-- Prefer a safer default aligned with signup flow
ALTER TABLE public.invites
	ALTER COLUMN role SET DEFAULT 'recruiter';

-- Extend allowed status values to cover possible flows (pending, accepted, declined, expired, rejected, sent)
ALTER TABLE public.invites
	DROP CONSTRAINT IF EXISTS invites_status_check;

ALTER TABLE public.invites
	ADD CONSTRAINT invites_status_check
	CHECK (status IN ('pending','accepted','declined','expired','rejected','sent'));

-- Keep helpful indexes (no-op if already exist)
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status); 