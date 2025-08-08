-- Migration: Complete contracts infrastructure setup
-- This migration adds missing contract-related views and functions

-- Create comprehensive contract offers view (the main missing piece)
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
    
    -- Contract details
    c.title as contract_title,
    c.content as contract_content,
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

-- Create contract offer details view (for backward compatibility)
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
  
  -- Contract details
  c.title as contract_title,
  c.content as contract_body,
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

-- Create contract analytics function
CREATE OR REPLACE FUNCTION public.get_contract_analytics(p_company_id UUID)
RETURNS TABLE(
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
      COUNT(*) as total_contracts,
      COUNT(*) FILTER (WHERE status = 'draft') as status_draft,
      COUNT(*) FILTER (WHERE status = 'active') as status_active,
      COUNT(*) FILTER (WHERE status = 'archived') as status_archived,
      COUNT(*) FILTER (WHERE status = 'deprecated') as status_deprecated,
      COUNT(*) FILTER (WHERE category = 'general') as category_general,
      COUNT(*) FILTER (WHERE category = 'technical') as category_technical,
      COUNT(*) FILTER (WHERE category = 'executive') as category_executive,
      COUNT(*) FILTER (WHERE category = 'intern') as category_intern,
      COUNT(*) FILTER (WHERE category = 'freelance') as category_freelance,
      COUNT(*) FILTER (WHERE category = 'custom') as category_custom,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as contracts_created_last_30_days
    FROM public.contracts 
    WHERE company_id = p_company_id
  ),
  offer_stats AS (
    SELECT 
      COUNT(*) as total_offers,
      COUNT(*) FILTER (WHERE co.status = 'signed') as signed_offers,
      COUNT(*) FILTER (WHERE co.sent_at >= NOW() - INTERVAL '30 days') as contracts_sent_last_30_days,
      COUNT(*) FILTER (WHERE co.signed_at >= NOW() - INTERVAL '30 days') as contracts_signed_last_30_days,
      COUNT(*) FILTER (WHERE co.rejected_at >= NOW() - INTERVAL '30 days') as contracts_rejected_last_30_days,
      AVG(EXTRACT(EPOCH FROM (co.signed_at - co.sent_at)) / 3600.0) FILTER (WHERE co.status = 'signed') as avg_signing_time_hours
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
    END as conversion_rate,
    ROUND(os.avg_signing_time_hours, 2) as avg_signing_time_hours
  FROM contract_stats cs, offer_stats os;
END;
$$;

-- Create function to increment contract usage count
CREATE OR REPLACE FUNCTION public.increment_contract_usage(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.contracts 
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = p_contract_id;
END;
$$;

-- Create updated_at triggers (if they don't exist)
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_contract_offers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_contracts_updated_at ON public.contracts;
CREATE TRIGGER trigger_update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION update_contracts_updated_at();

DROP TRIGGER IF EXISTS trigger_update_contract_offers_updated_at ON public.contract_offers;
CREATE TRIGGER trigger_update_contract_offers_updated_at
BEFORE UPDATE ON public.contract_offers
FOR EACH ROW
EXECUTE FUNCTION update_contract_offers_updated_at();

-- Grant permissions
GRANT SELECT ON public.contract_offers_comprehensive TO authenticated;
GRANT SELECT ON public.contract_offers_comprehensive TO anon;
GRANT SELECT ON public.contract_offer_details TO authenticated;
GRANT SELECT ON public.contract_offer_details TO anon;

GRANT EXECUTE ON FUNCTION public.get_contract_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_contract_usage(UUID) TO authenticated;

-- Add RLS policies for anonymous access (needed for contract signing)
DROP POLICY IF EXISTS "Anonymous users can view contract offers for signing" ON public.contract_offers;
DROP POLICY IF EXISTS "Anonymous users can update contract offers for signing" ON public.contract_offers;

CREATE POLICY "Anonymous users can view contract offers for signing" ON public.contract_offers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can update contract offers for signing" ON public.contract_offers
  FOR UPDATE
  TO anon
  USING (true);

-- Add comments
COMMENT ON VIEW public.contract_offers_comprehensive IS 'Comprehensive view for contract offers with all related data including candidate, contract, company, and job details';
COMMENT ON VIEW public.contract_offer_details IS 'Simplified view for contract offer details with essential information';
COMMENT ON FUNCTION public.get_contract_analytics(UUID) IS 'Returns comprehensive analytics for contracts and contract offers for a company';
COMMENT ON FUNCTION public.increment_contract_usage(UUID) IS 'Increments usage count and updates updated_at for a contract'; 