-- Simple fix for contracts API errors
-- Addresses: "operator does not exist: numeric / text" and "Use of aggregate functions is not allowed"

-- Ensure contracts table has required columns
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS status contract_status DEFAULT 'draft' NOT NULL,
ADD COLUMN IF NOT EXISTS category contract_category DEFAULT 'general' NOT NULL,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Fix the get_contract_analytics function to handle type mismatches properly
CREATE OR REPLACE FUNCTION public.get_contract_analytics(p_company_id UUID)
RETURNS TABLE(
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
    -- Fix type mismatch: ensure both operands are NUMERIC and result is NUMERIC
    CASE 
      WHEN os.total_offers > 0 THEN ROUND((os.signed_offers::NUMERIC / os.total_offers::NUMERIC) * 100, 2)
      ELSE 0::NUMERIC 
    END as conversion_rate,
    COALESCE(os.avg_signing_time_hours, 0::NUMERIC) as avg_signing_time_hours
  FROM contract_stats cs
  CROSS JOIN offer_stats os;
END;
$$;

-- Create simple functions to get popular job titles and employment types
-- This avoids the aggregate function issues in PostgREST

CREATE OR REPLACE FUNCTION public.get_popular_contract_job_titles(p_company_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  job_title_id UUID,
  job_title_name TEXT,
  usage_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jt.id as job_title_id,
    jt.name as job_title_name,
    COUNT(*) as usage_count
  FROM contracts c
  JOIN job_titles jt ON c.job_title_id = jt.id
  WHERE c.company_id = p_company_id 
    AND c.job_title_id IS NOT NULL
  GROUP BY jt.id, jt.name
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_popular_contract_employment_types(p_company_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  employment_type_id UUID,
  employment_type_name TEXT,
  usage_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id as employment_type_id,
    et.name as employment_type_name,
    COUNT(*) as usage_count
  FROM contracts c
  JOIN employment_types et ON c.employment_type_id = et.id
  WHERE c.company_id = p_company_id 
    AND c.employment_type_id IS NOT NULL
  GROUP BY et.id, et.name
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_popular_contract_job_titles(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_contract_employment_types(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contract_analytics(UUID) TO authenticated;
