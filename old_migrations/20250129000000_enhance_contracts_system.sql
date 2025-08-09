-- Enhancement migration for contracts system
-- Adds status management, categories, analytics, and organizational features

-- Create contract status enum
CREATE TYPE contract_status AS ENUM ('draft', 'active', 'archived', 'deprecated');

-- Create contract category enum  
CREATE TYPE contract_category AS ENUM ('general', 'technical', 'executive', 'intern', 'freelance', 'custom');

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

-- Create indexes for contract_offers
CREATE INDEX IF NOT EXISTS idx_contract_offers_contract_id ON public.contract_offers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_candidate_id ON public.contract_offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_status ON public.contract_offers(status);
CREATE INDEX IF NOT EXISTS idx_contract_offers_sent_by ON public.contract_offers(sent_by);
CREATE INDEX IF NOT EXISTS idx_contract_offers_signing_token ON public.contract_offers(signing_token);
CREATE INDEX IF NOT EXISTS idx_contract_offers_expires_at ON public.contract_offers(expires_at);

-- Enable RLS for contract_offers
ALTER TABLE public.contract_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contract_offers
CREATE POLICY "Users can view contract offers for their company" ON public.contract_offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            JOIN public.profiles p ON c.company_id = p.company_id
            WHERE c.id = contract_offers.contract_id
            AND p.id = auth.uid()
        )
    );

CREATE POLICY "Users can create contract offers for their company contracts" ON public.contract_offers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts c
            JOIN public.profiles p ON c.company_id = p.company_id
            WHERE c.id = contract_offers.contract_id
            AND p.id = auth.uid()
        )
    );

CREATE POLICY "Users can update contract offers for their company" ON public.contract_offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            JOIN public.profiles p ON c.company_id = p.company_id
            WHERE c.id = contract_offers.contract_id
            AND p.id = auth.uid()
        )
    );

-- Add new columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS status contract_status DEFAULT 'draft' NOT NULL,
ADD COLUMN IF NOT EXISTS category contract_category DEFAULT 'general' NOT NULL,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);

-- Create index on is_favorite for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_is_favorite ON contracts(is_favorite);

-- Create index on usage_count for sorting
CREATE INDEX IF NOT EXISTS idx_contracts_usage_count ON contracts(usage_count DESC);

-- Create index on last_used_at for sorting
CREATE INDEX IF NOT EXISTS idx_contracts_last_used_at ON contracts(last_used_at DESC NULLS LAST);

-- Create GIN index on tags for array operations
CREATE INDEX IF NOT EXISTS idx_contracts_tags ON contracts USING GIN(tags);

-- Create composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_contracts_company_status_category ON contracts(company_id, status, category);

-- Update the comprehensive view to include new fields
DROP VIEW IF EXISTS contracts_comprehensive;

CREATE OR REPLACE VIEW contracts_comprehensive AS
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
  -- Job title details
  jt.id AS "job_title.id",
  jt.name AS "job_title.name",
  -- Employment type details
  et.id AS "employment_type.id", 
  et.name AS "employment_type.name",
  -- Creator profile details
  p.id AS "created_by_profile.id",
  p.first_name AS "created_by_profile.first_name",
  p.last_name AS "created_by_profile.last_name",
  p.email AS "created_by_profile.email"
FROM contracts c
LEFT JOIN job_titles jt ON c.job_title_id = jt.id
LEFT JOIN employment_types et ON c.employment_type_id = et.id  
LEFT JOIN profiles p ON c.created_by = p.id;

-- Update the paginated function to include new fields and filtering
DROP FUNCTION IF EXISTS get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION get_contracts_paginated(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
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
  id UUID,
  company_id UUID,
  job_title_id UUID,
  title TEXT,
  body TEXT,
  employment_type_id UUID,
  contract_duration TEXT,
  status contract_status,
  category contract_category,
  is_favorite BOOLEAN,
  tags TEXT[],
  usage_count INTEGER,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  job_title_name TEXT,
  employment_type_name TEXT,
  created_by_name TEXT,
  created_by_email TEXT,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
  sort_clause TEXT;
BEGIN
  -- Build sort clause
  CASE p_sort_by
    WHEN 'title' THEN sort_clause := 'c.title';
    WHEN 'updated_at' THEN sort_clause := 'c.updated_at';  
    WHEN 'usage_count' THEN sort_clause := 'c.usage_count';
    WHEN 'last_used_at' THEN sort_clause := 'c.last_used_at';
    ELSE sort_clause := 'c.created_at';
  END CASE;
  
  IF p_sort_order = 'asc' THEN
    sort_clause := sort_clause || ' ASC';
  ELSE
    sort_clause := sort_clause || ' DESC';
  END IF;

  -- Handle NULL sorting for last_used_at
  IF p_sort_by = 'last_used_at' AND p_sort_order = 'desc' THEN
    sort_clause := sort_clause || ' NULLS LAST';
  ELSIF p_sort_by = 'last_used_at' AND p_sort_order = 'asc' THEN
    sort_clause := sort_clause || ' NULLS FIRST';
  END IF;

  query_text := '
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
      jt.name as job_title_name,
      et.name as employment_type_name,
      (p.first_name || '' '' || p.last_name) as created_by_name,
      p.email as created_by_email,
      COUNT(*) OVER() as total_count
    FROM contracts c
    LEFT JOIN job_titles jt ON c.job_title_id = jt.id
    LEFT JOIN employment_types et ON c.employment_type_id = et.id
    LEFT JOIN profiles p ON c.created_by = p.id
    WHERE c.company_id = $1';

  -- Add search filter
  IF p_search IS NOT NULL AND p_search != '' THEN
    query_text := query_text || ' AND (c.title ILIKE ''%' || p_search || '%'' OR c.body ILIKE ''%' || p_search || '%'')';
  END IF;

  -- Add job title filter
  IF p_job_title_id IS NOT NULL THEN
    query_text := query_text || ' AND c.job_title_id = ''' || p_job_title_id || '''';
  END IF;

  -- Add employment type filter
  IF p_employment_type_id IS NOT NULL THEN
    query_text := query_text || ' AND c.employment_type_id = ''' || p_employment_type_id || '''';
  END IF;

  -- Add created by filter
  IF p_created_by IS NOT NULL THEN
    query_text := query_text || ' AND c.created_by = ''' || p_created_by || '''';
  END IF;

  -- Add status filter
  IF p_status IS NOT NULL THEN
    query_text := query_text || ' AND c.status = ''' || p_status || '''';
  END IF;

  -- Add category filter
  IF p_category IS NOT NULL THEN
    query_text := query_text || ' AND c.category = ''' || p_category || '''';
  END IF;

  -- Add favorite filter
  IF p_is_favorite IS NOT NULL THEN
    query_text := query_text || ' AND c.is_favorite = ' || p_is_favorite;
  END IF;

  -- Add tags filter (contains any of the specified tags)
  IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
    query_text := query_text || ' AND c.tags && ARRAY[''' || array_to_string(p_tags, ''',''') || ''']';
  END IF;

  -- Add date range filter
  IF p_date_from IS NOT NULL THEN
    query_text := query_text || ' AND c.created_at >= ''' || p_date_from || '''';
  END IF;

  IF p_date_to IS NOT NULL THEN
    query_text := query_text || ' AND c.created_at <= ''' || p_date_to || '''';
  END IF;

  -- Add sorting and pagination
  query_text := query_text || ' ORDER BY ' || sort_clause || ' LIMIT $2 OFFSET $3';

  RETURN QUERY EXECUTE query_text USING p_company_id, p_limit, p_offset;
END;
$$;

-- Create function for contract analytics
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
      COUNT(*) FILTER (WHERE status = 'draft') as status_draft,
      COUNT(*) FILTER (WHERE status = 'active') as status_active,
      COUNT(*) FILTER (WHERE status = 'archived') as status_archived,
      COUNT(*) FILTER (WHERE status = 'deprecated') as status_deprecated,
      COUNT(*) FILTER (WHERE category = 'general') as category_general,
      COUNT(*) FILTER (WHERE category = 'technical') as category_technical,
      COUNT(*) FILTER (WHERE category = 'executive') as category_executive,
      COUNT(*) FILTER (WHERE category = 'intern') as category_intern,
      COUNT(*) FILTER (WHERE category = 'freelance') as category_freelance,
      COUNT(*) FILTER (WHERE category = 'custom') as category_custom,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as contracts_created_last_30_days
    FROM contracts 
    WHERE company_id = p_company_id
  ),
  offer_stats AS (
    SELECT 
      COUNT(*) as total_offers,
      COUNT(*) FILTER (WHERE status = 'signed') as signed_offers,
      COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '30 days') as contracts_sent_last_30_days,
      COUNT(*) FILTER (WHERE signed_at >= NOW() - INTERVAL '30 days') as contracts_signed_last_30_days,
      COUNT(*) FILTER (WHERE rejected_at >= NOW() - INTERVAL '30 days') as contracts_rejected_last_30_days,
      AVG(EXTRACT(EPOCH FROM (signed_at - sent_at))/3600.0) FILTER (WHERE signed_at IS NOT NULL) as avg_signing_time_hours
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

CREATE TRIGGER contract_offer_usage_trigger
AFTER INSERT ON contract_offers
FOR EACH ROW
EXECUTE FUNCTION trigger_increment_contract_usage();

-- Update RLS policies for new fields
-- The existing policies should cover the new fields automatically

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