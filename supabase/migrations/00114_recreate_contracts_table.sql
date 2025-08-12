-- Recreate/ensure contracts table schema to match expected fields without data loss
-- Idempotent: uses IF NOT EXISTS and catalog checks

-- Ensure enums exist
DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('draft', 'active', 'archived', 'deprecated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contract_category AS ENUM ('general', 'technical', 'executive', 'intern', 'freelance', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Base table create (no-op if exists)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add/ensure legacy and extended fields
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS job_title_id UUID,
  ADD COLUMN IF NOT EXISTS employment_type_id UUID,
  ADD COLUMN IF NOT EXISTS contract_duration INTERVAL,
  ADD COLUMN IF NOT EXISTS status contract_status DEFAULT 'draft' NOT NULL,
  ADD COLUMN IF NOT EXISTS category contract_category DEFAULT 'general' NOT NULL,
  ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_contract_id UUID,
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS currency_id UUID;

-- Backfill content/body if one is missing then enforce NOT NULL
UPDATE public.contracts SET content = body WHERE content IS NULL AND body IS NOT NULL;
UPDATE public.contracts SET body = content WHERE body IS NULL AND content IS NOT NULL;

ALTER TABLE public.contracts
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN body SET NOT NULL;

-- Foreign keys for new columns if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contracts_job_title_id_fkey'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_job_title_id_fkey FOREIGN KEY (job_title_id) REFERENCES public.job_titles(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contracts_employment_type_id_fkey'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_employment_type_id_fkey FOREIGN KEY (employment_type_id) REFERENCES public.employment_types(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contracts_parent_contract_id_fkey'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure currency linkage and backfill default USD, then enforce NOT NULL
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS currency_id UUID;

UPDATE public.contracts c
SET currency_id = (SELECT id FROM public.currencies WHERE code = 'USD' LIMIT 1)
WHERE currency_id IS NULL;

DO $$ BEGIN
  -- add FK if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_currency_id_fkey'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);
  END IF;
END $$;

ALTER TABLE public.contracts
  ALTER COLUMN currency_id SET NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON public.contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_is_template ON public.contracts(is_template);
CREATE INDEX IF NOT EXISTS idx_contracts_parent_contract_id ON public.contracts(parent_contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_is_favorite ON public.contracts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_contracts_usage_count ON public.contracts(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_last_used_at ON public.contracts(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON public.contracts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contracts_company_status_category ON public.contracts(company_id, status, category);
CREATE INDEX IF NOT EXISTS idx_contracts_currency_id ON public.contracts(currency_id);

-- RLS enable
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (create if not exists)
DO $$ BEGIN
  CREATE POLICY "Company members can view their contracts" ON public.contracts
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = contracts.company_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company members can manage their contracts" ON public.contracts
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = contracts.company_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view public contract templates" ON public.contracts
    FOR SELECT USING (is_public = true AND is_template = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated_at trigger (drop/create to be safe on name)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contracts_updated_at') THEN
    DROP TRIGGER update_contracts_updated_at ON public.contracts;
  END IF;
END $$;

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 