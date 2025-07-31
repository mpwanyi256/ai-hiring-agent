-- Fix function overloading issue for get_contracts_paginated
-- Remove all existing versions and create a single definitive version

-- Drop all possible versions of get_contracts_paginated to resolve overloading
DROP FUNCTION IF EXISTS public.get_contracts_paginated(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_contracts_paginated(UUID, TEXT, UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_contracts_paginated(UUID, TEXT, UUID, UUID, INTEGER, INTEGER);

-- Create the single definitive get_contracts_paginated function that matches the API call
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
  title VARCHAR(255),
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
  job_title_name VARCHAR(150),
  employment_type_name VARCHAR(100),
  created_by_first_name VARCHAR(100),
  created_by_last_name VARCHAR(100),
  created_by_email VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
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
    p.first_name as created_by_first_name,
    p.last_name as created_by_last_name,
    p.email as created_by_email
  FROM contracts c
  LEFT JOIN job_titles jt ON c.job_title_id = jt.id
  LEFT JOIN employment_types et ON c.employment_type_id = et.id
  LEFT JOIN profiles p ON c.created_by = p.id
  WHERE c.company_id = p_company_id
    AND (p_search IS NULL OR (c.title ILIKE '%' || p_search || '%' OR c.body ILIKE '%' || p_search || '%'))
    AND (p_job_title_id IS NULL OR c.job_title_id = p_job_title_id)
    AND (p_employment_type_id IS NULL OR c.employment_type_id = p_employment_type_id)
    AND (p_created_by IS NULL OR c.created_by = p_created_by)
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_is_favorite IS NULL OR c.is_favorite = p_is_favorite)
    AND (p_tags IS NULL OR c.tags && p_tags)
    AND (p_date_from IS NULL OR c.created_at >= p_date_from)
    AND (p_date_to IS NULL OR c.created_at <= p_date_to)
  ORDER BY 
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'asc' THEN c.title END ASC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'desc' THEN c.title END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN c.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN c.created_at END DESC,
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'asc' THEN c.updated_at END ASC,
    CASE WHEN p_sort_by = 'updated_at' AND p_sort_order = 'desc' THEN c.updated_at END DESC,
    CASE WHEN p_sort_by = 'usage_count' AND p_sort_order = 'asc' THEN c.usage_count END ASC,
    CASE WHEN p_sort_by = 'usage_count' AND p_sort_order = 'desc' THEN c.usage_count END DESC,
    c.created_at DESC -- default fallback
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
