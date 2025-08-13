-- Create a contracts view to normalize fields for API consumption
CREATE OR REPLACE VIEW public.contracts_view AS
SELECT
  c.id,
  c.company_id,
  c.title,
  c.content,
  c.job_title_id,
  c.status,
  c.is_favorite,
  c.created_by,
  c.created_at,
  c.updated_at,
  jt.name AS job_title_name,
  p.first_name AS created_by_first_name,
  p.last_name AS created_by_last_name,
  p.email AS created_by_email
FROM public.contracts c
LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
LEFT JOIN public.profiles p ON c.created_by = p.id;

COMMENT ON VIEW public.contracts_view IS 'Contracts flattened view for API consumption (simplified schema)';

-- Update get_contracts_paginated to use the view and new fields
DROP FUNCTION IF EXISTS public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_contracts_paginated(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_job_title_id UUID DEFAULT NULL,
  p_employment_type_id UUID DEFAULT NULL, -- ignored in simplified schema
  p_created_by UUID DEFAULT NULL,
  p_status contract_status DEFAULT NULL,
  p_category contract_category DEFAULT NULL, -- ignored in simplified schema
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL, -- ignored in simplified schema
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
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  job_title_name TEXT,
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
  -- Map sort column
  CASE p_sort_by
    WHEN 'title' THEN sort_column := 'v.title';
    WHEN 'status' THEN sort_column := 'v.status';
    WHEN 'updated_at' THEN sort_column := 'v.updated_at';
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
    CASE WHEN sort_column = 'v.created_at' AND p_sort_order = 'asc' THEN c.created_at END ASC,
    CASE WHEN sort_column = 'v.created_at' AND p_sort_order = 'desc' THEN c.created_at END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT SELECT ON public.contracts_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated; 