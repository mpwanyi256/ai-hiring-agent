-- Add rejection_reason to contract_offers_comprehensive view
-- The view was missing the rejection_reason column which is why it's not appearing in API responses

-- Drop and recreate the view with rejection_reason included
DROP VIEW IF EXISTS contract_offers_comprehensive;

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
    co.rejection_reason,  -- Added this missing field
    co.signing_token,
    co.additional_terms,
    co.sent_by,
    co.created_at,
    co.updated_at,
    c.title AS contract_title,
    c.body AS contract_content,
    c.company_id AS contract_company_id,
    ci.first_name AS candidate_first_name,
    ci.last_name AS candidate_last_name,
    ci.email AS candidate_email,
    ci.phone AS candidate_phone,
    ci.linkedin_url AS candidate_linkedin_url,
    ci.portfolio_url AS candidate_portfolio_url,
    cand.status AS candidate_status,
    cand.job_id AS candidate_job_id,
    p.first_name AS sent_by_first_name,
    p.last_name AS sent_by_last_name,
    p.email AS sent_by_email,
    comp.name AS company_name,
    comp.slug AS company_slug,
    comp.logo_url AS company_logo_url,
    j.title AS job_title,
    j.workplace_type AS job_workplace_type,
    j.job_type AS job_job_type,
    dept.name AS job_department_name,
    jt.name AS job_title_name,
    et.name AS employment_type_name,
    curr.code AS currency_code,
    curr.symbol AS currency_symbol,
    curr.name AS currency_name
FROM contract_offers co
LEFT JOIN contracts c ON co.contract_id = c.id
LEFT JOIN candidates cand ON co.candidate_id = cand.id
LEFT JOIN candidates_info ci ON cand.candidate_info_id = ci.id
LEFT JOIN profiles p ON co.sent_by = p.id
LEFT JOIN companies comp ON c.company_id = comp.id
LEFT JOIN jobs j ON cand.job_id = j.id
LEFT JOIN departments dept ON j.department_id = dept.id
LEFT JOIN job_titles jt ON j.job_title_id = jt.id
LEFT JOIN employment_types et ON j.employment_type_id = et.id
LEFT JOIN currencies curr ON co.salary_currency::text = curr.code::text;

-- Add comment explaining the fix
COMMENT ON VIEW contract_offers_comprehensive IS 'Comprehensive view of contract offers with all related data including rejection_reason field for complete contract offer information.';
