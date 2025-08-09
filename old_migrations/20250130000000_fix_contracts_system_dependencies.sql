-- Fix contracts system dependencies and ambiguous column references
-- This migration ensures proper table creation order and fixes analytics function

-- First, ensure the contracts table exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_title_id UUID REFERENCES public.job_titles(id),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    employment_type_id UUID REFERENCES public.employment_types(id),
    contract_duration INTERVAL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contract status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('draft', 'active', 'archived', 'deprecated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create contract category enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE contract_category AS ENUM ('general', 'technical', 'executive', 'intern', 'freelance', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to contracts table if they don't exist
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS status contract_status DEFAULT 'draft' NOT NULL,
ADD COLUMN IF NOT EXISTS category contract_category DEFAULT 'general' NOT NULL,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Create contract_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contract_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'signed', 'rejected')),
    signed_copy_url TEXT,
    sent_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    signing_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    salary_amount DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE,
    end_date DATE,
    additional_terms JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contracts table if they don't exist
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON public.contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_is_favorite ON public.contracts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_contracts_usage_count ON public.contracts(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_last_used_at ON public.contracts(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON public.contracts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contracts_company_status_category ON public.contracts(company_id, status, category);

-- Create indexes for contract_offers table if they don't exist
CREATE INDEX IF NOT EXISTS idx_contract_offers_contract_id ON public.contract_offers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_candidate_id ON public.contract_offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_status ON public.contract_offers(status);
CREATE INDEX IF NOT EXISTS idx_contract_offers_sent_by ON public.contract_offers(sent_by);
CREATE INDEX IF NOT EXISTS idx_contract_offers_signing_token ON public.contract_offers(signing_token);
CREATE INDEX IF NOT EXISTS idx_contract_offers_expires_at ON public.contract_offers(expires_at);

-- Enable RLS for both tables
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contracts if they don't exist
DO $$ BEGIN
    CREATE POLICY "Users can view contracts for their company" ON public.contracts
        FOR SELECT USING (company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create contracts for their company" ON public.contracts
        FOR INSERT WITH CHECK (company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update contracts for their company" ON public.contracts
        FOR UPDATE USING (company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete contracts for their company" ON public.contracts
        FOR DELETE USING (company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RLS policies for contract_offers if they don't exist
DO $$ BEGIN
    CREATE POLICY "Users can view contract offers for their company" ON public.contract_offers
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.contracts c
                JOIN public.profiles p ON c.company_id = p.company_id
                WHERE c.id = contract_offers.contract_id
                AND p.id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create contract offers for their company contracts" ON public.contract_offers
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.contracts c
                JOIN public.profiles p ON c.company_id = p.company_id
                WHERE c.id = contract_offers.contract_id
                AND p.id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update contract offers for their company" ON public.contract_offers
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.contracts c
                JOIN public.profiles p ON c.company_id = p.company_id
                WHERE c.id = contract_offers.contract_id
                AND p.id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the comprehensive view if it exists
DROP VIEW IF EXISTS public.contracts_comprehensive;

-- Create or replace the contracts comprehensive view
CREATE OR REPLACE VIEW public.contracts_comprehensive AS
SELECT 
    c.id,
    c.company_id,
    c.job_title_id,
    c.title,
    c.body,
    c.employment_type_id,
    c.contract_duration,
    c.status,
    c.category,
    c.is_favorite,
    c.tags,
    c.usage_count,
    c.last_used_at,
    c.created_by,
    c.created_at,
    c.updated_at,
    -- Job title information
    jt.id as job_title_id_ref,
    jt.name as job_title_name,
    -- Employment type information
    et.id as employment_type_id_ref,
    et.name as employment_type_name,
    -- Created by profile information
    p.id as created_by_profile_id,
    p.first_name as created_by_first_name,
    p.last_name as created_by_last_name,
    p.email as created_by_email,
    -- Company information
    comp.id as company_id_ref,
    comp.name as company_name,
    comp.slug as company_slug
FROM public.contracts c
LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
LEFT JOIN public.profiles p ON c.created_by = p.id
LEFT JOIN public.companies comp ON c.company_id = comp.id;

-- Drop the paginated function if it exists
DROP FUNCTION IF EXISTS get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT);

-- Create or replace the paginated contracts function
CREATE OR REPLACE FUNCTION get_contracts_paginated(
  p_company_id UUID,
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 10,
  p_search TEXT DEFAULT NULL,
  p_job_title_id UUID DEFAULT NULL,
  p_employment_type_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_status contract_status DEFAULT NULL,
  p_category contract_category DEFAULT NULL,
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE (
  contracts JSON,
  total_count BIGINT,
  total_pages INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INTEGER;
  where_conditions TEXT[] := ARRAY['c.company_id = $1'];
  param_count INTEGER := 1;
  sort_clause TEXT;
BEGIN
  -- Calculate offset
  offset_val := (p_page - 1) * p_limit;
  
  -- Build WHERE conditions
  IF p_search IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('(c.title ILIKE $%s OR c.body ILIKE $%s)', param_count, param_count));
  END IF;
  
  IF p_job_title_id IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.job_title_id = $%s', param_count));
  END IF;
  
  IF p_employment_type_id IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.employment_type_id = $%s', param_count));
  END IF;
  
  IF p_created_by IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.created_by = $%s', param_count));
  END IF;
  
  IF p_status IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.status = $%s', param_count));
  END IF;
  
  IF p_category IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.category = $%s', param_count));
  END IF;
  
  IF p_is_favorite IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.is_favorite = $%s', param_count));
  END IF;
  
  IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.tags && $%s', param_count));
  END IF;
  
  IF p_date_from IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.created_at >= $%s', param_count));
  END IF;
  
  IF p_date_to IS NOT NULL THEN
    param_count := param_count + 1;
    where_conditions := array_append(where_conditions, format('c.created_at <= $%s', param_count));
  END IF;
  
  -- Build sort clause
  sort_clause := format('ORDER BY c.%I %s', p_sort_by, p_sort_order);
  
  -- Return results
  RETURN QUERY EXECUTE format(
    'SELECT 
      json_agg(
        json_build_object(
          ''id'', c.id,
          ''companyId'', c.company_id,
          ''jobTitleId'', c.job_title_id,
          ''title'', c.title,
          ''body'', c.body,
          ''employmentTypeId'', c.employment_type_id,
          ''contractDuration'', c.contract_duration,
          ''status'', c.status,
          ''category'', c.category,
          ''isFavorite'', c.is_favorite,
          ''tags'', c.tags,
          ''usageCount'', c.usage_count,
          ''lastUsedAt'', c.last_used_at,
          ''createdBy'', c.created_by,
          ''createdAt'', c.created_at,
          ''updatedAt'', c.updated_at,
          ''jobTitle'', json_build_object(''id'', jt.id, ''name'', jt.name),
          ''employmentType'', json_build_object(''id'', et.id, ''name'', et.name),
          ''createdByProfile'', json_build_object(''id'', p.id, ''firstName'', p.first_name, ''lastName'', p.last_name, ''email'', p.email),
          ''company'', json_build_object(''id'', comp.id, ''name'', comp.name, ''slug'', comp.slug)
        )
      ) as contracts,
      COUNT(*) OVER() as total_count,
      CEIL(COUNT(*) OVER()::NUMERIC / $%s) as total_pages
    FROM public.contracts c
    LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
    LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
    LEFT JOIN public.profiles p ON c.created_by = p.id
    LEFT JOIN public.companies comp ON c.company_id = comp.id
    WHERE %s
    %s
    LIMIT $%s OFFSET $%s',
    param_count + 1,
    array_to_string(where_conditions, ' AND '),
    sort_clause,
    param_count + 2,
    param_count + 3
  ) USING p_company_id, p_search, p_search, p_job_title_id, p_employment_type_id, p_created_by, p_status, p_category, p_is_favorite, p_tags, p_date_from, p_date_to, p_limit, offset_val;
END;
$$;

-- Create or replace the analytics function with fixed ambiguous column references
CREATE OR REPLACE FUNCTION get_contract_analytics(p_company_id UUID)
RETURNS TABLE (
  total_contracts BIGINT,
  status_draft BIGINT,
  status_active BIGINT,
  status_archived BIGINT,
  status_deprecated BIGINT,
  category_general BIGINT,
  category_technical BIGINT,
  category_executive BIGINT,
  category_intern BIGINT,
  category_freelance BIGINT,
  category_custom BIGINT,
  contracts_created_last_30_days BIGINT,
  contracts_sent_last_30_days BIGINT,
  contracts_signed_last_30_days BIGINT,
  contracts_rejected_last_30_days BIGINT,
  total_offers BIGINT,
  signed_offers BIGINT,
  conversion_rate NUMERIC,
  avg_signing_time_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH contract_stats AS (
    SELECT 
      COUNT(*) as total_contracts,
      COUNT(*) FILTER (WHERE c.status = 'draft') as status_draft,
      COUNT(*) FILTER (WHERE c.status = 'active') as status_active,
      COUNT(*) FILTER (WHERE c.status = 'archived') as status_archived,
      COUNT(*) FILTER (WHERE c.status = 'deprecated') as status_deprecated,
      COUNT(*) FILTER (WHERE c.category = 'general') as category_general,
      COUNT(*) FILTER (WHERE c.category = 'technical') as category_technical,
      COUNT(*) FILTER (WHERE c.category = 'executive') as category_executive,
      COUNT(*) FILTER (WHERE c.category = 'intern') as category_intern,
      COUNT(*) FILTER (WHERE c.category = 'freelance') as category_freelance,
      COUNT(*) FILTER (WHERE c.category = 'custom') as category_custom,
      COUNT(*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '30 days') as contracts_created_last_30_days
    FROM contracts c
    WHERE c.company_id = p_company_id
  ),
  offer_stats AS (
    SELECT 
      COUNT(*) as total_offers,
      COUNT(*) FILTER (WHERE co.status = 'signed') as signed_offers,
      COUNT(*) FILTER (WHERE co.sent_at >= NOW() - INTERVAL '30 days') as contracts_sent_last_30_days,
      COUNT(*) FILTER (WHERE co.signed_at >= NOW() - INTERVAL '30 days') as contracts_signed_last_30_days,
      COUNT(*) FILTER (WHERE co.rejected_at >= NOW() - INTERVAL '30 days') as contracts_rejected_last_30_days,
      AVG(EXTRACT(EPOCH FROM (co.signed_at - co.sent_at))/3600.0) FILTER (WHERE co.signed_at IS NOT NULL) as avg_signing_time_hours
    FROM contract_offers co
    JOIN contracts c ON co.contract_id = c.id
    WHERE c.company_id = p_company_id
  )
  SELECT 
    cs.total_contracts,
    cs.status_draft,
    cs.status_active,
    cs.status_archived,
    cs.status_deprecated,
    cs.category_general,
    cs.category_technical,
    cs.category_executive,
    cs.category_intern,
    cs.category_freelance,
    cs.category_custom,
    cs.contracts_created_last_30_days,
    os.contracts_sent_last_30_days,
    os.contracts_signed_last_30_days,
    os.contracts_rejected_last_30_days,
    os.total_offers,
    os.signed_offers,
    CASE 
      WHEN os.total_offers > 0 THEN ROUND((os.signed_offers::NUMERIC / os.total_offers::NUMERIC) * 100, 2)
      ELSE 0 
    END as conversion_rate,
    COALESCE(os.avg_signing_time_hours, 0) as avg_signing_time_hours
  FROM contract_stats cs
  CROSS JOIN offer_stats os;
END;
$$;

-- Create function to update contract usage count
CREATE OR REPLACE FUNCTION increment_contract_usage(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contracts 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = p_contract_id;
END;
$$;

-- Create trigger to automatically update contract usage when a contract offer is created
CREATE OR REPLACE FUNCTION trigger_increment_contract_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM increment_contract_usage(NEW.contract_id);
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS contract_offer_usage_trigger ON public.contract_offers;
CREATE TRIGGER contract_offer_usage_trigger
AFTER INSERT ON public.contract_offers
FOR EACH ROW
EXECUTE FUNCTION trigger_increment_contract_usage();

-- Create function for bulk operations
CREATE OR REPLACE FUNCTION bulk_update_contracts(
  p_company_id UUID,
  p_contract_ids UUID[],
  p_status contract_status DEFAULT NULL,
  p_category contract_category DEFAULT NULL,
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE contracts 
  SET 
    status = COALESCE(p_status, status),
    category = COALESCE(p_category, category),
    is_favorite = COALESCE(p_is_favorite, is_favorite),
    tags = COALESCE(p_tags, tags),
    updated_at = NOW()
  WHERE 
    company_id = p_company_id 
    AND id = ANY(p_contract_ids);
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_contract_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_contract_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_contracts(UUID, UUID[], contract_status, contract_category, BOOLEAN, TEXT[]) TO authenticated;

-- Add updated_at trigger for contracts table
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_contracts_updated_at ON public.contracts;
CREATE TRIGGER trigger_update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION update_contracts_updated_at();

-- Add updated_at trigger for contract_offers table
CREATE OR REPLACE FUNCTION update_contract_offers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_contract_offers_updated_at ON public.contract_offers;
CREATE TRIGGER trigger_update_contract_offers_updated_at
BEFORE UPDATE ON public.contract_offers
FOR EACH ROW
EXECUTE FUNCTION update_contract_offers_updated_at(); 