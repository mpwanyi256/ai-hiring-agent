-- Fix get_contract_analytics signature to match original while working with simplified schema

-- Drop existing function to allow changing return type
DROP FUNCTION IF EXISTS public.get_contract_analytics(UUID);

-- Recreate with original return columns
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
      COUNT(*) FILTER (WHERE status = 'draft') AS status_draft,
      COUNT(*) FILTER (WHERE status = 'active') AS status_active,
      COUNT(*) FILTER (WHERE status = 'archived') AS status_archived,
      COUNT(*) FILTER (WHERE status = 'deprecated') AS status_deprecated,
      -- Categories removed from simplified schema; return zeros for compatibility
      0::BIGINT AS category_general,
      0::BIGINT AS category_technical,
      0::BIGINT AS category_executive,
      0::BIGINT AS category_intern,
      0::BIGINT AS category_freelance,
      0::BIGINT AS category_custom,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS contracts_created_last_30_days
    FROM public.contracts 
    WHERE company_id = p_company_id
  ),
  offer_stats AS (
    SELECT 
      COUNT(*) AS total_offers,
      COUNT(*) FILTER (WHERE status = 'signed') AS signed_offers,
      COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '30 days') AS contracts_sent_last_30_days,
      COUNT(*) FILTER (WHERE signed_at >= NOW() - INTERVAL '30 days') AS contracts_signed_last_30_days,
      COUNT(*) FILTER (WHERE rejected_at >= NOW() - INTERVAL '30 days') AS contracts_rejected_last_30_days,
      AVG(EXTRACT(EPOCH FROM (signed_at - sent_at))/3600.0) FILTER (WHERE signed_at IS NOT NULL) AS avg_signing_time_hours
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

GRANT EXECUTE ON FUNCTION public.get_contract_analytics(UUID) TO authenticated; 