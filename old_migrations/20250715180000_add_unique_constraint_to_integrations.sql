-- Drop existing unique constraint
ALTER TABLE public.integrations DROP CONSTRAINT IF EXISTS unique_company_provider;

-- Add unique constraint for upsert support
ALTER TABLE public.integrations
ADD CONSTRAINT unique_company_provider UNIQUE (company_id, user_id, provider); 