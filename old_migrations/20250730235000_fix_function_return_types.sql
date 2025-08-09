-- Fix function return type mismatches for job titles and employment types

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_popular_contract_job_titles(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_popular_contract_employment_types(UUID, INTEGER);

-- Fix the get_popular_contract_job_titles function to match actual column types
CREATE OR REPLACE FUNCTION public.get_popular_contract_job_titles(p_company_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  job_title_id UUID,
  job_title_name VARCHAR(150), -- Match the actual column type
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

-- Fix the get_popular_contract_employment_types function to match actual column types
CREATE OR REPLACE FUNCTION public.get_popular_contract_employment_types(p_company_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  employment_type_id UUID,
  employment_type_name VARCHAR(100), -- Match the actual column type
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
