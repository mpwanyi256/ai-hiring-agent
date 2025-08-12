-- Prune unused columns from contracts table
-- This migration drops columns not used by the application

-- Drop dependent RLS policies that reference removed columns
DROP POLICY IF EXISTS "Anyone can view public contract templates" ON public.contracts;

-- Drop indexes that depend on removed columns
DROP INDEX IF EXISTS idx_contracts_is_template;
DROP INDEX IF EXISTS idx_contracts_parent_contract_id;
DROP INDEX IF EXISTS idx_contracts_currency_id;

-- Drop foreign key constraints related to removed columns
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_parent_contract_id_fkey') THEN
    ALTER TABLE public.contracts DROP CONSTRAINT contracts_parent_contract_id_fkey;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_currency_id_fkey') THEN
    ALTER TABLE public.contracts DROP CONSTRAINT contracts_currency_id_fkey;
  END IF;
END $$;

-- Drop the unused columns (idempotent)
ALTER TABLE public.contracts
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS template_data,
  DROP COLUMN IF EXISTS version,
  DROP COLUMN IF EXISTS parent_contract_id,
  DROP COLUMN IF EXISTS is_template,
  DROP COLUMN IF EXISTS is_public,
  DROP COLUMN IF EXISTS currency_id;

-- Note: Keep other columns: title, content, body, company_id, created_by,
-- job_title_id, employment_type_id, contract_duration, status, category,
-- is_favorite, tags, usage_count, last_used_at, created_at, updated_at

-- Done 