-- Rebuild contracts schema with minimal fields
-- WARNING: This migration DROPs existing tables and recreates contracts with a reduced schema.

-- 1) Drop dependent tables first (categories), then contracts
DROP TABLE IF EXISTS public.contract_categories CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;

-- 2) Ensure enums exist
DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('draft', 'active', 'archived', 'deprecated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Try to enable trigram support if available
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'pg_trgm extension not available (insufficient privileges), skipping creation';
END $$;

-- 3) Create minimal contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  job_title_id UUID REFERENCES public.job_titles(id) ON DELETE SET NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_job_title_id ON public.contracts(job_title_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- Create trigram index only if extension exists, otherwise skip
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_contracts_title_trgm ON public.contracts USING gin (title gin_trgm_ops);
  ELSE
    RAISE NOTICE 'pg_trgm not installed; skipping trigram index on contracts.title';
  END IF;
END $$;

-- 5) Enable RLS and policies
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "contracts_select_company" ON public.contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = contracts.company_id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "contracts_modify_company" ON public.contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = contracts.company_id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) Optional: updated_at trigger if function exists
DO $$ BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'update_updated_at_column';
  IF FOUND THEN
    CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 