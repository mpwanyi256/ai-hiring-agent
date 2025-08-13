-- Fix analytics functions to work with simplified contracts schema

-- Drop existing functions that reference removed columns
DROP FUNCTION IF EXISTS public.get_popular_contract_employment_types(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_popular_contract_job_titles(UUID, INTEGER);

-- Recreate job titles function to work with simplified schema
CREATE OR REPLACE FUNCTION public.get_popular_contract_job_titles(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  job_title_id UUID,
  job_title_name VARCHAR(150),
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
    COUNT(*)::BIGINT as usage_count
  FROM public.contracts c
  JOIN public.job_titles jt ON c.job_title_id = jt.id
  WHERE c.company_id = p_company_id 
    AND c.job_title_id IS NOT NULL
  GROUP BY jt.id, jt.name
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$;

-- Since employment_type_id was removed, create a stub function that returns empty results
CREATE OR REPLACE FUNCTION public.get_popular_contract_employment_types(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  employment_type_id UUID,
  employment_type_name VARCHAR(100),
  usage_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return empty result since employment_type_id was removed from contracts
  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_popular_contract_job_titles(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_contract_employment_types(UUID, INTEGER) TO authenticated; 