-- Create comprehensive view for contract offers with all related data
-- This view joins contract_offers with contracts, candidates, candidates_info, profiles, companies, etc.
-- to provide a single source of truth for contract offer data

-- Drop existing view if it exists
DROP VIEW IF EXISTS contract_offers_comprehensive;

-- Create the comprehensive view
CREATE VIEW contract_offers_comprehensive AS
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
    co.signing_token,
    co.additional_terms,
    co.sent_by,
    co.created_at,
    co.updated_at,
    
    -- Contract details
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

FROM contract_offers co
    -- Join with contracts table
    LEFT JOIN contracts c ON co.contract_id = c.id
    
    -- Join with candidates table
    LEFT JOIN candidates cand ON co.candidate_id = cand.id
    
    -- Join with candidates_info table
    LEFT JOIN candidates_info ci ON cand.candidate_info_id = ci.id
    
    -- Join with profiles table (sent by)
    LEFT JOIN profiles p ON co.sent_by = p.id
    
    -- Join with companies table
    LEFT JOIN companies comp ON c.company_id = comp.id
    
    -- Join with jobs table (from candidate's job application)
    LEFT JOIN jobs j ON cand.job_id = j.id
    
    -- Join with departments table
    LEFT JOIN departments dept ON j.department_id = dept.id
    
    -- Join with job_titles table
    LEFT JOIN job_titles jt ON j.job_title_id = jt.id
    
    -- Join with employment_types table
    LEFT JOIN employment_types et ON j.employment_type_id = et.id
    
    -- Join with currencies table
    LEFT JOIN currencies curr ON co.salary_currency = curr.code;

-- Note: RLS policies are handled by the underlying tables
-- Views inherit security from their base tables

-- Grant permissions
GRANT SELECT ON contract_offers_comprehensive TO authenticated;
GRANT SELECT ON contract_offers_comprehensive TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_offers_comprehensive_company_id 
    ON contract_offers (contract_id);
    
CREATE INDEX IF NOT EXISTS idx_contract_offers_comprehensive_candidate_id 
    ON contract_offers (candidate_id);
    
CREATE INDEX IF NOT EXISTS idx_contract_offers_comprehensive_signing_token 
    ON contract_offers (signing_token);
    
CREATE INDEX IF NOT EXISTS idx_contract_offers_comprehensive_status 
    ON contract_offers (status);

-- Add comment for documentation
COMMENT ON VIEW contract_offers_comprehensive IS 'Comprehensive view for contract offers with all related data including candidate, contract, company, and job details';
