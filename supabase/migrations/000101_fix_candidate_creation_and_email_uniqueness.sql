-- Migration: Fix candidate creation duplication and enforce email uniqueness

-- ============================================================================
-- PART 1: Deduplicate existing emails (case-insensitive) and add normalized column
-- ============================================================================

-- Clean up obvious whitespace and case issues for consistency
UPDATE public.candidates_info
SET email = LOWER(BTRIM(email))
WHERE email IS NOT NULL AND email <> LOWER(BTRIM(email));

-- Deduplicate candidates_info by normalized email: keep the smallest id, re-point candidates, delete others
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    WITH normalized AS (
      SELECT id, LOWER(BTRIM(email)) AS norm
      FROM public.candidates_info
      WHERE email IS NOT NULL AND email <> ''
    ), groups AS (
      SELECT norm, ARRAY_AGG(id ORDER BY id) AS ids
      FROM normalized
      GROUP BY norm
      HAVING COUNT(*) > 1
    )
    SELECT norm, ids[1] AS keeper_id, ids[2:array_length(ids,1)] AS dup_ids
    FROM groups
  LOOP
    -- Re-point candidate references to keeper
    UPDATE public.candidates c
    SET candidate_info_id = rec.keeper_id
    WHERE c.candidate_info_id = ANY(rec.dup_ids);

    -- Delete duplicate candidate_info rows
    DELETE FROM public.candidates_info ci
    WHERE ci.id = ANY(rec.dup_ids);
  END LOOP;
END $$;

-- Add generated normalized email column and unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'candidates_info' AND column_name = 'email_normalized'
  ) THEN
    ALTER TABLE public.candidates_info
      ADD COLUMN email_normalized TEXT GENERATED ALWAYS AS (LOWER(BTRIM(email))) STORED;
  END IF;
END $$;

-- Drop any previous uniqueness artifacts on email_normalized and create a unique constraint
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.candidates_info DROP CONSTRAINT candidates_info_email_key;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.candidates_info ADD CONSTRAINT candidates_info_email_key UNIQUE (email_normalized);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Optional: Keep normalization triggers, but they are no longer required due to generated column
DROP TRIGGER IF EXISTS trg_normalize_candidates_info_email_ins ON public.candidates_info;
DROP TRIGGER IF EXISTS trg_normalize_candidates_info_email_upd ON public.candidates_info;
DROP FUNCTION IF EXISTS public.normalize_candidates_info_email();

-- ============================================================================
-- PART 2: Ensure unique candidate per job (idempotent)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidates_job_candidate_info_unique' 
      AND table_name = 'candidates'
  ) THEN
    ALTER TABLE public.candidates 
      ADD CONSTRAINT candidates_job_candidate_info_unique UNIQUE (job_id, candidate_info_id);
  END IF;
END $$;

-- ============================================================================
-- PART 3: Harden create_candidate_info_and_record to avoid duplicates and races
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_candidate_info_and_record(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_job_id UUID,
  p_interview_token TEXT
)
RETURNS JSON AS $$
DECLARE
  normalized_email TEXT;
  new_candidate_info_id UUID;
  candidate_id UUID;
BEGIN
  -- Normalize email (trim + lower); basic validation
  normalized_email := NULLIF(LOWER(BTRIM(p_email)), '');

  IF normalized_email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Upsert candidate info using the normalized unique constraint
  INSERT INTO public.candidates_info (id, first_name, last_name, email, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    p_first_name,
    p_last_name,
    normalized_email,
    NOW(),
    NOW()
  )
  ON CONFLICT ON CONSTRAINT candidates_info_email_key
  DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW()
  RETURNING id INTO new_candidate_info_id;

  -- Insert candidate per job; be idempotent on (job_id, candidate_info_id)
  INSERT INTO public.candidates (
    id, job_id, candidate_info_id, interview_token, current_step, total_steps, is_completed, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    p_job_id,
    new_candidate_info_id,
    p_interview_token,
    1,
    5,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT ON CONSTRAINT candidates_job_candidate_info_unique
  DO UPDATE SET updated_at = EXCLUDED.updated_at
  RETURNING id INTO candidate_id;

  RETURN json_build_object(
    'success', true,
    'candidate_info_id', new_candidate_info_id,
    'candidate_id', candidate_id,
    'message', 'Candidate info and record created (idempotent)'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate_info_and_record(TEXT, TEXT, TEXT, UUID, TEXT) TO anon; 