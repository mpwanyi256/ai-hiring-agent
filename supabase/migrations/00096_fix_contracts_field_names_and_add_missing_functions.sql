-- Migration: Fix contracts field name inconsistencies and add missing functions
-- This migration addresses the body/content field confusion and adds missing columns and functions

-- First, add missing columns to contracts table if they don't exist
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}' NOT NULL,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.job_titles(id),
ADD COLUMN IF NOT EXISTS employment_type_id UUID REFERENCES public.employment_types(id),
ADD COLUMN IF NOT EXISTS contract_duration INTERVAL;

-- Ensure we have a 'body' column - add it as an alias to content if missing
-- This maintains compatibility with both naming conventions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'body') THEN
        ALTER TABLE public.contracts ADD COLUMN body TEXT;
        -- Copy content to body for existing records
        UPDATE public.contracts SET body = content WHERE body IS NULL AND content IS NOT NULL;
        -- Set body as NOT NULL after copying data
        ALTER TABLE public.contracts ALTER COLUMN body SET NOT NULL;
    END IF;
END $$;

-- Update our views to use 'body' consistently
DROP VIEW IF EXISTS public.contract_offers_comprehensive;
CREATE OR REPLACE VIEW public.contract_offers_comprehensive AS
SELECT 
    co.id,
    co.candidate_id,
    co.contract_id,
    co.status,
    co.salary_amount,
    co.salary_currency,
    co.start_date,
    co.end_date,
    co.expires_at,
    co.sent_at,
    co.signed_at,
    co.rejected_at,
    co.rejection_reason,
    co.signing_token,
    co.additional_terms,
    co.sent_by,
    co.created_at,
    co.updated_at,
    
    -- Contract details (using 'body' for consistency)
    c.title as contract_title,
    c.body as contract_content,
    c.company_id as contract_company_id,
    
    -- Candidate details from candidates_info
    ci.first_name as candidate_first_name,
    ci.last_name as candidate_last_name,
    ci.email as candidate_email,
    ci.phone as candidate_phone,
    ci.linkedin_url as candidate_linkedin_url,
    ci.portfolio_url as candidate_portfolio_url,
    
    -- Candidate status from candidates table
    cand.status as candidate_status,
    cand.job_id as candidate_job_id,
    
    -- Sent by profile details
    p.first_name as sent_by_first_name,
    p.last_name as sent_by_last_name,
    p.email as sent_by_email,
    
    -- Company details
    comp.name as company_name,
    comp.slug as company_slug,
    comp.logo_url as company_logo_url,
    
    -- Job details (from candidate's job application)
    j.title as job_title,
    j.workplace_type as job_workplace_type,
    j.job_type as job_job_type,
    
    -- Department details
    dept.name as job_department_name,
    
    -- Employment type and job title details
    jt.name as job_title_name,
    et.name as employment_type_name,
    
    -- Currency details
    curr.code as currency_code,
    curr.symbol as currency_symbol,
    curr.name as currency_name

FROM public.contract_offers co
    -- Join with contracts table
    LEFT JOIN public.contracts c ON co.contract_id = c.id
    
    -- Join with candidates table
    LEFT JOIN public.candidates cand ON co.candidate_id = cand.id
    
    -- Join with candidates_info table
    LEFT JOIN public.candidates_info ci ON cand.candidate_info_id = ci.id
    
    -- Join with profiles table (sent by)
    LEFT JOIN public.profiles p ON co.sent_by = p.id
    
    -- Join with companies table
    LEFT JOIN public.companies comp ON c.company_id = comp.id
    
    -- Join with jobs table (from candidate's job application)
    LEFT JOIN public.jobs j ON cand.job_id = j.id
    
    -- Join with departments table
    LEFT JOIN public.departments dept ON j.department_id = dept.id
    
    -- Join with job_titles table
    LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
    
    -- Join with employment_types table
    LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
    
    -- Join with currencies table
    LEFT JOIN public.currencies curr ON co.salary_currency = curr.code;

-- Update contract_offer_details view to use 'body'
DROP VIEW IF EXISTS public.contract_offer_details;
CREATE OR REPLACE VIEW public.contract_offer_details AS
SELECT 
  co.id,
  co.contract_id,
  co.candidate_id,
  co.sent_by,
  co.status,
  co.sent_at,
  co.signed_at,
  co.rejected_at,
  co.expires_at,
  co.signing_token,
  co.salary_amount,
  co.salary_currency,
  co.start_date,
  co.end_date,
  co.additional_terms,
  co.rejection_reason,
  co.created_at,
  co.updated_at,
  
  -- Contract details (using 'body' for consistency)
  c.title as contract_title,
  c.body as contract_body,
  c.company_id,
  
  -- Candidate details
  ci.email as candidate_email,
  ci.first_name as candidate_first_name,
  ci.last_name as candidate_last_name,
  ci.phone as candidate_phone,
  
  -- Sender details (who sent the contract)
  sender_profile.email as sender_email,
  sender_profile.first_name as sender_first_name,
  sender_profile.last_name as sender_last_name,
  
  -- Company details
  comp.name as company_name,
  comp.slug as company_slug
  
FROM public.contract_offers co
LEFT JOIN public.contracts c ON co.contract_id = c.id
LEFT JOIN public.candidates cand ON co.candidate_id = cand.id
LEFT JOIN public.candidates_info ci ON cand.candidate_info_id = ci.id
LEFT JOIN public.profiles sender_profile ON co.sent_by = sender_profile.id
LEFT JOIN public.companies comp ON c.company_id = comp.id;

-- Create the missing get_contracts_paginated function
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
  EXECUTE format('
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
    FROM public.contracts c
    LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
    LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
    LEFT JOIN public.profiles p ON c.created_by = p.id
    WHERE c.company_id = $1
    %s %s %s %s %s %s %s %s %s
    ORDER BY %s %s
    LIMIT $2 OFFSET $3',
    CASE WHEN search_pattern IS NOT NULL THEN 
      'AND (c.title ILIKE ''' || search_pattern || ''' OR c.body ILIKE ''' || search_pattern || ''')' 
      ELSE '' END,
    CASE WHEN p_job_title_id IS NOT NULL THEN 'AND c.job_title_id = ''' || p_job_title_id || '''' ELSE '' END,
    CASE WHEN p_employment_type_id IS NOT NULL THEN 'AND c.employment_type_id = ''' || p_employment_type_id || '''' ELSE '' END,
    CASE WHEN p_created_by IS NOT NULL THEN 'AND c.created_by = ''' || p_created_by || '''' ELSE '' END,
    CASE WHEN p_status IS NOT NULL THEN 'AND c.status = ''' || p_status || '''' ELSE '' END,
    CASE WHEN p_category IS NOT NULL THEN 'AND c.category = ''' || p_category || '''' ELSE '' END,
    CASE WHEN p_is_favorite IS NOT NULL THEN 'AND c.is_favorite = ' || p_is_favorite ELSE '' END,
    CASE WHEN p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN 'AND c.tags && ARRAY[''' || array_to_string(p_tags, ''',''') || ''']' ELSE '' END,
    CASE WHEN p_date_from IS NOT NULL AND p_date_to IS NOT NULL THEN 
      'AND c.created_at BETWEEN ''' || p_date_from || ''' AND ''' || p_date_to || ''''
      WHEN p_date_from IS NOT NULL THEN 'AND c.created_at >= ''' || p_date_from || ''''
      WHEN p_date_to IS NOT NULL THEN 'AND c.created_at <= ''' || p_date_to || ''''
      ELSE '' END,
    sort_column,
    CASE WHEN p_sort_order = 'asc' THEN 'ASC' ELSE 'DESC' END
  ) USING p_company_id, p_limit, p_offset;
END;
$$;

-- Update the increment_contract_usage function to use last_used_at
CREATE OR REPLACE FUNCTION public.increment_contract_usage(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.contracts 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_contract_id;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.contract_offers_comprehensive TO authenticated;
GRANT SELECT ON public.contract_offers_comprehensive TO anon;
GRANT SELECT ON public.contract_offer_details TO authenticated;
GRANT SELECT ON public.contract_offer_details TO anon;

GRANT EXECUTE ON FUNCTION public.get_contracts_paginated(UUID, INTEGER, INTEGER, TEXT, UUID, UUID, UUID, contract_status, contract_category, BOOLEAN, TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_contract_usage(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_contracts_paginated IS 'Returns paginated contracts with filtering and sorting options';
COMMENT ON FUNCTION public.increment_contract_usage(UUID) IS 'Increments usage count and updates last_used_at for a contract'; 