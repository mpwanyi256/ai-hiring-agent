-- Contract usage tracking and view/function updates

-- 1) Create contract_usage table (one row per contract offer issuance)
CREATE TABLE IF NOT EXISTS public.contract_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contract_offer_id UUID NOT NULL REFERENCES public.contract_offers(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_usage_contract_id ON public.contract_usage(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_usage_offer_id ON public.contract_usage(contract_offer_id);
CREATE INDEX IF NOT EXISTS idx_contract_usage_used_at ON public.contract_usage(used_at DESC);

-- Enable RLS and company-scoped policies via contracts
ALTER TABLE public.contract_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view their contract usage" ON public.contract_usage;
CREATE POLICY "Company members can view their contract usage" ON public.contract_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.profiles p ON p.company_id = c.company_id
      WHERE c.id = contract_usage.contract_id
        AND p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert contract usage" ON public.contract_usage;
CREATE POLICY "System can insert contract usage" ON public.contract_usage
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.profiles p ON p.company_id = c.company_id
      WHERE c.id = contract_usage.contract_id
        AND p.id = auth.uid()
    )
  );

-- 2) Trigger to insert usage on new contract offer
CREATE OR REPLACE FUNCTION public.trigger_insert_contract_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.contract_usage (contract_id, contract_offer_id, used_at, used_by)
  VALUES (NEW.contract_id, NEW.id, COALESCE(NEW.sent_at, NOW()), NEW.sent_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_contract_offer_usage ON public.contract_offers;
CREATE TRIGGER trg_contract_offer_usage
AFTER INSERT ON public.contract_offers
FOR EACH ROW EXECUTE FUNCTION public.trigger_insert_contract_usage();

-- 3) Update contracts_view to include usage_count and last_used_at from contract_usage
DROP VIEW IF EXISTS public.contracts_view;

CREATE VIEW public.contracts_view AS
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
  COALESCE(u.usage_count, 0) AS usage_count,
  u.last_used_at,
  jt.name AS job_title_name,
  p.first_name AS created_by_first_name,
  p.last_name AS created_by_last_name,
  p.email AS created_by_email
FROM public.contracts c
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS usage_count, MAX(used_at) AS last_used_at
  FROM public.contract_usage cu
  WHERE cu.contract_id = c.id
) u ON TRUE
LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
LEFT JOIN public.profiles p ON c.created_by = p.id;

COMMENT ON VIEW public.contracts_view IS 'Contracts flattened view incl. usage_count and last_used_at from contract_usage';

-- 4) Update get_contracts_paginated to surface usage fields and allow sorting by them
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

GRANT SELECT ON public.contracts_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated; 