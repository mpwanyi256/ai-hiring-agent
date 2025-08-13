-- (Re)create comprehensive contract offers view used by API endpoints
-- This migration is additive and safe to re-run

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
    
    -- Contract details
    c.title AS contract_title,
    c.content AS contract_content,
    c.company_id AS contract_company_id,
    
    -- Candidate details from candidates_info
    ci.first_name AS candidate_first_name,
    ci.last_name AS candidate_last_name,
    ci.email AS candidate_email,
    ci.phone AS candidate_phone,
    ci.linkedin_url AS candidate_linkedin_url,
    ci.portfolio_url AS candidate_portfolio_url,
    
    -- Candidate status from candidates table
    cand.status AS candidate_status,
    cand.job_id AS candidate_job_id,
    
    -- Sent by profile details
    p.first_name AS sent_by_first_name,
    p.last_name AS sent_by_last_name,
    p.email AS sent_by_email,
    
    -- Company details
    comp.name AS company_name,
    comp.slug AS company_slug,
    comp.logo_url AS company_logo_url,
    
    -- Job details (from candidate's job application)
    j.title AS job_title,
    j.workplace_type AS job_workplace_type,
    j.job_type AS job_job_type,
    
    -- Department details
    dept.name AS job_department_name,
    
    -- Employment type and job title details
    jt.name AS job_title_name,
    et.name AS employment_type_name,
    
    -- Currency details
    curr.code AS currency_code,
    curr.symbol AS currency_symbol,
    curr.name AS currency_name
FROM public.contract_offers co
    LEFT JOIN public.contracts c ON co.contract_id = c.id
    LEFT JOIN public.candidates cand ON co.candidate_id = cand.id
    LEFT JOIN public.candidates_info ci ON cand.candidate_info_id = ci.id
    LEFT JOIN public.profiles p ON co.sent_by = p.id
    LEFT JOIN public.companies comp ON c.company_id = comp.id
    LEFT JOIN public.jobs j ON cand.job_id = j.id
    LEFT JOIN public.departments dept ON j.department_id = dept.id
    LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
    LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
    LEFT JOIN public.currencies curr ON co.salary_currency = curr.code;

COMMENT ON VIEW public.contract_offers_comprehensive IS 'Comprehensive view for contract offers with related candidate, contract, company, job, and currency details';

GRANT SELECT ON public.contract_offers_comprehensive TO authenticated;
GRANT SELECT ON public.contract_offers_comprehensive TO anon; 