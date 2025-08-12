-- Create user-defined contract categories and link contracts via FK
-- Normalized design: categories are per company

-- 1) Create contract_categories table
CREATE TABLE IF NOT EXISTS public.contract_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index for case-insensitive uniqueness per company
CREATE UNIQUE INDEX IF NOT EXISTS uq_contract_categories_company_name
  ON public.contract_categories (company_id, LOWER(name));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contract_categories_company_id ON public.contract_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_categories_active ON public.contract_categories(is_active);

-- 2) Enable RLS and policies (company-scoped)
ALTER TABLE public.contract_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Company members can view their contract categories" ON public.contract_categories
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = contract_categories.company_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company members can manage their contract categories" ON public.contract_categories
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = contract_categories.company_id)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Add contract_category_id to contracts and backfill from existing enum category
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_category_id UUID;

-- Insert missing categories per company based on existing enum/text column
-- Use DISTINCT ON to avoid aggregate on UUID and pick a deterministic row per group
INSERT INTO public.contract_categories (company_id, name, created_by)
SELECT DISTINCT ON (c.company_id, (c.category)::text)
       c.company_id,
       (c.category)::text AS name,
       c.created_by
FROM public.contracts c
WHERE c.category IS NOT NULL
ORDER BY c.company_id, (c.category)::text, c.created_at
ON CONFLICT DO NOTHING;

-- Backfill FK on contracts
UPDATE public.contracts c
SET contract_category_id = cc.id
FROM public.contract_categories cc
WHERE c.contract_category_id IS NULL
  AND cc.company_id = c.company_id
  AND LOWER(cc.name) = LOWER((c.category)::text);

-- Add FK constraint after backfill
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_contract_category_id_fkey'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_contract_category_id_fkey FOREIGN KEY (contract_category_id)
      REFERENCES public.contract_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index to speed lookups
CREATE INDEX IF NOT EXISTS idx_contracts_contract_category_id ON public.contracts(contract_category_id);

-- Enforce NOT NULL if all rows have been backfilled successfully
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.contracts WHERE contract_category_id IS NULL
  ) THEN
    ALTER TABLE public.contracts ALTER COLUMN contract_category_id SET NOT NULL;
  END IF;
END $$;

-- Note: We intentionally keep the legacy enum column contracts.category for backward compatibility.
-- After application code migrates to use contract_category_id, we can drop the enum column in a future migration.

-- updated_at trigger for contract_categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_categories_updated_at') THEN
    CREATE TRIGGER update_contract_categories_updated_at
      BEFORE UPDATE ON public.contract_categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 