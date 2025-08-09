-- Migration: Fix get_contracts_paginated function return types
-- This migration fixes the type mismatch where VARCHAR columns should be TEXT

-- Drop and recreate the function with correct return types
DROP FUNCTION IF EXISTS public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_contracts_paginated(
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
  body TEXT,
  employment_type_id UUID,
  contract_duration INTERVAL,
  status contract_status,
  category contract_category,
  is_favorite BOOLEAN,
  tags TEXT[],
  usage_count INTEGER,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  job_title_name TEXT,
  employment_type_name TEXT,
  created_by_first_name TEXT,
  created_by_last_name TEXT,
  created_by_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sort_column TEXT;
  search_pattern TEXT;
BEGIN
  -- Validate sort column to prevent SQL injection
  CASE p_sort_by
    WHEN 'title' THEN sort_column := 'c.title';
    WHEN 'status' THEN sort_column := 'c.status';
    WHEN 'category' THEN sort_column := 'c.category';
    WHEN 'usage_count' THEN sort_column := 'c.usage_count';
    WHEN 'last_used_at' THEN sort_column := 'c.last_used_at';
    WHEN 'updated_at' THEN sort_column := 'c.updated_at';
    ELSE sort_column := 'c.created_at';
  END CASE;

  -- Prepare search pattern
  IF p_search IS NOT NULL AND length(trim(p_search)) > 0 THEN
    search_pattern := '%' || trim(p_search) || '%';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.company_id,
    c.job_title_id,
    c.title::TEXT,
    c.body::TEXT,
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
    COALESCE(jt.name, '')::TEXT as job_title_name,
    COALESCE(et.name, '')::TEXT as employment_type_name,
    COALESCE(p.first_name, '')::TEXT as created_by_first_name,
    COALESCE(p.last_name, '')::TEXT as created_by_last_name,
    COALESCE(p.email, '')::TEXT as created_by_email
  FROM public.contracts c
  LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
  LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
  LEFT JOIN public.profiles p ON c.created_by = p.id
  WHERE c.company_id = p_company_id
    AND (search_pattern IS NULL OR (c.title ILIKE search_pattern OR c.body ILIKE search_pattern))
    AND (p_job_title_id IS NULL OR c.job_title_id = p_job_title_id)
    AND (p_employment_type_id IS NULL OR c.employment_type_id = p_employment_type_id)
    AND (p_created_by IS NULL OR c.created_by = p_created_by)
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_is_favorite IS NULL OR c.is_favorite = p_is_favorite)
    AND (p_tags IS NULL OR array_length(p_tags, 1) IS NULL OR c.tags && p_tags)
    AND (p_date_from IS NULL OR c.created_at >= p_date_from)
    AND (p_date_to IS NULL OR c.created_at <= p_date_to)
  ORDER BY 
    CASE WHEN sort_column = 'c.title' AND p_sort_order = 'asc' THEN c.title END ASC,
    CASE WHEN sort_column = 'c.title' AND p_sort_order = 'desc' THEN c.title END DESC,
    CASE WHEN sort_column = 'c.status' AND p_sort_order = 'asc' THEN c.status::TEXT END ASC,
    CASE WHEN sort_column = 'c.status' AND p_sort_order = 'desc' THEN c.status::TEXT END DESC,
    CASE WHEN sort_column = 'c.category' AND p_sort_order = 'asc' THEN c.category::TEXT END ASC,
    CASE WHEN sort_column = 'c.category' AND p_sort_order = 'desc' THEN c.category::TEXT END DESC,
    CASE WHEN sort_column = 'c.usage_count' AND p_sort_order = 'asc' THEN c.usage_count END ASC,
    CASE WHEN sort_column = 'c.usage_count' AND p_sort_order = 'desc' THEN c.usage_count END DESC,
    CASE WHEN sort_column = 'c.last_used_at' AND p_sort_order = 'asc' THEN c.last_used_at END ASC,
    CASE WHEN sort_column = 'c.last_used_at' AND p_sort_order = 'desc' THEN c.last_used_at END DESC,
    CASE WHEN sort_column = 'c.updated_at' AND p_sort_order = 'asc' THEN c.updated_at END ASC,
    CASE WHEN sort_column = 'c.updated_at' AND p_sort_order = 'desc' THEN c.updated_at END DESC,
    CASE WHEN sort_column = 'c.created_at' AND p_sort_order = 'asc' THEN c.created_at END ASC,
    CASE WHEN sort_column = 'c.created_at' AND p_sort_order = 'desc' THEN c.created_at END DESC
  LIMIT p_limit 
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_contracts_paginated IS 'Returns paginated contracts with filtering and sorting options - fixed return types'; 