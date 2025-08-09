-- Fix for PGRST123: Use of aggregate functions is not allowed
-- Create views for popular job titles and employment types for contracts analytics

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.popular_contract_job_titles;
DROP VIEW IF EXISTS public.popular_contract_employment_types;

-- Create a view for popular job titles used in contracts (by company)
CREATE VIEW public.popular_contract_job_titles AS
SELECT
  jt.id AS job_title_id,
  jt.name AS job_title_name,
  c.company_id,
  COUNT(*) AS usage_count
FROM public.contracts c
JOIN public.job_titles jt ON c.job_title_id = jt.id
WHERE c.job_title_id IS NOT NULL
GROUP BY jt.id, jt.name, c.company_id;

-- Create a view for popular employment types used in contracts (by company)
CREATE VIEW public.popular_contract_employment_types AS
SELECT
  et.id AS employment_type_id,
  et.name AS employment_type_name,
  c.company_id,
  COUNT(*) AS usage_count
FROM public.contracts c
JOIN public.employment_types et ON c.employment_type_id = et.id
WHERE c.employment_type_id IS NOT NULL
GROUP BY et.id, et.name, c.company_id; 