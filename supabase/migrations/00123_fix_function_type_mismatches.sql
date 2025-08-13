-- Fix function return type mismatches and ambiguous column references

-- 1) Fix get_contracts_paginated return type mismatch for job_title_name
DROP FUNCTION IF EXISTS public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_contracts_paginated(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_job_title_id UUID DEFAULT NULL,
  p_employment_type_id UUID DEFAULT NULL, -- ignored
  p_created_by UUID DEFAULT NULL,
  p_status contract_status DEFAULT NULL,
  p_category contract_category DEFAULT NULL, -- ignored
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL, -- ignored
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS TABLE(
  id UUID,
  company_id UUID,
  job_title_id UUID,
  title TEXT,
  content TEXT,
  status contract_status,
  is_favorite BOOLEAN,
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  job_title_name VARCHAR(150),
  created_by_first_name TEXT,
  created_by_last_name TEXT,
  created_by_email TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sort_column TEXT;
  search_pattern TEXT;
BEGIN
  CASE p_sort_by
    WHEN 'title' THEN sort_column := 'v.title';
    WHEN 'status' THEN sort_column := 'v.status';
    WHEN 'updated_at' THEN sort_column := 'v.updated_at';
    WHEN 'usage_count' THEN sort_column := 'v.usage_count';
    WHEN 'last_used_at' THEN sort_column := 'v.last_used_at';
    ELSE sort_column := 'v.created_at';
  END CASE;

  IF p_search IS NOT NULL AND length(trim(p_search)) > 0 THEN
    search_pattern := '%' || trim(p_search) || '%';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT v.*
    FROM public.contracts_view v
    WHERE v.company_id = p_company_id
      AND (search_pattern IS NULL OR (v.title ILIKE search_pattern OR v.content ILIKE search_pattern))
      AND (p_job_title_id IS NULL OR v.job_title_id = p_job_title_id)
      AND (p_created_by IS NULL OR v.created_by = p_created_by)
      AND (p_status IS NULL OR v.status = p_status)
      AND (p_date_from IS NULL OR v.created_at >= p_date_from)
      AND (p_date_to IS NULL OR v.created_at <= p_date_to)
  ), counted AS (
    SELECT f.*, (SELECT COUNT(*) FROM filtered f2) AS total_count
    FROM filtered f
  )
  SELECT 
    c.id,
    c.company_id,
    c.job_title_id,
    c.title,
    c.content,
    c.status,
    c.is_favorite,
    c.usage_count,
    c.last_used_at,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.job_title_name,
    c.created_by_first_name,
    c.created_by_last_name,
    c.created_by_email,
    c.total_count
  FROM counted c
  ORDER BY 
    CASE WHEN sort_column = 'v.title' AND p_sort_order = 'asc' THEN c.title END ASC,
    CASE WHEN sort_column = 'v.title' AND p_sort_order = 'desc' THEN c.title END DESC,
    CASE WHEN sort_column = 'v.status' AND p_sort_order = 'asc' THEN c.status::TEXT END ASC,
    CASE WHEN sort_column = 'v.status' AND p_sort_order = 'desc' THEN c.status::TEXT END DESC,
    CASE WHEN sort_column = 'v.updated_at' AND p_sort_order = 'asc' THEN c.updated_at END ASC,
    CASE WHEN sort_column = 'v.updated_at' AND p_sort_order = 'desc' THEN c.updated_at END DESC,
    CASE WHEN sort_column = 'v.usage_count' AND p_sort_order = 'asc' THEN c.usage_count END ASC,
    CASE WHEN sort_column = 'v.usage_count' AND p_sort_order = 'desc' THEN c.usage_count END DESC,
    CASE WHEN sort_column = 'v.last_used_at' AND p_sort_order = 'asc' THEN c.last_used_at END ASC,
    CASE WHEN sort_column = 'v.last_used_at' AND p_sort_order = 'desc' THEN c.last_used_at END DESC,
    CASE WHEN sort_column = 'v.created_at' AND p_sort_order = 'asc' THEN c.created_at END ASC,
    CASE WHEN sort_column = 'v.created_at' AND p_sort_order = 'desc' THEN c.created_at END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 2) Fix get_contract_analytics ambiguous column references
DROP FUNCTION IF EXISTS public.get_contract_analytics(UUID);

CREATE OR REPLACE FUNCTION public.get_contract_analytics(p_company_id UUID)
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
      COUNT(*) AS total_contracts,
      COUNT(*) FILTER (WHERE c.status = 'draft') AS status_draft,
      COUNT(*) FILTER (WHERE c.status = 'active') AS status_active,
      COUNT(*) FILTER (WHERE c.status = 'archived') AS status_archived,
      COUNT(*) FILTER (WHERE c.status = 'deprecated') AS status_deprecated,
      -- Categories removed from simplified schema; return zeros for compatibility
      0::BIGINT AS category_general,
      0::BIGINT AS category_technical,
      0::BIGINT AS category_executive,
      0::BIGINT AS category_intern,
      0::BIGINT AS category_freelance,
      0::BIGINT AS category_custom,
      COUNT(*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '30 days') AS contracts_created_last_30_days
    FROM public.contracts c
    WHERE c.company_id = p_company_id
  ),
  offer_stats AS (
    SELECT 
      COUNT(*) AS total_offers,
      COUNT(*) FILTER (WHERE co.status = 'signed') AS signed_offers,
      COUNT(*) FILTER (WHERE co.sent_at >= NOW() - INTERVAL '30 days') AS contracts_sent_last_30_days,
      COUNT(*) FILTER (WHERE co.signed_at >= NOW() - INTERVAL '30 days') AS contracts_signed_last_30_days,
      COUNT(*) FILTER (WHERE co.rejected_at >= NOW() - INTERVAL '30 days') AS contracts_rejected_last_30_days,
      AVG(EXTRACT(EPOCH FROM (co.signed_at - co.sent_at))/3600.0) FILTER (WHERE co.signed_at IS NOT NULL) AS avg_signing_time_hours
    FROM public.contract_offers co
    JOIN public.contracts c ON co.contract_id = c.id
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
    END AS conversion_rate,
    COALESCE(os.avg_signing_time_hours, 0) AS avg_signing_time_hours
  FROM contract_stats cs
  CROSS JOIN offer_stats os;
END;
$$;

-- 3) Grant permissions
GRANT EXECUTE ON FUNCTION public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contract_analytics(UUID) TO authenticated; 