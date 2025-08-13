-- Recreate contract_offer_details view to match current schema

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
  co.signed_copy_url,
  co.created_at,
  co.updated_at,

  -- Contract details
  c.title AS contract_title,
  c.content AS contract_content,
  c.company_id,

  -- Candidate info
  ci.email AS candidate_email,
  ci.first_name AS candidate_first_name,
  ci.last_name AS candidate_last_name,
  ci.phone AS candidate_phone,

  -- Sender profile details
  sp.email AS sender_email,
  sp.first_name AS sender_first_name,
  sp.last_name AS sender_last_name,

  -- Company details
  comp.name AS company_name,
  comp.slug AS company_slug,

  -- Job details from candidate's job
  j.title AS job_title,
  j.workplace_type AS job_workplace_type,
  j.job_type AS job_job_type,
  dept.name AS job_department_name,

  -- Job title and employment type names
  jt.name AS job_title_name,
  et.name AS employment_type_name

FROM public.contract_offers co
LEFT JOIN public.contracts c ON co.contract_id = c.id
LEFT JOIN public.candidates cand ON co.candidate_id = cand.id
LEFT JOIN public.candidates_info ci ON cand.candidate_info_id = ci.id
LEFT JOIN public.profiles sp ON co.sent_by = sp.id
LEFT JOIN public.companies comp ON c.company_id = comp.id
LEFT JOIN public.jobs j ON cand.job_id = j.id
LEFT JOIN public.departments dept ON j.department_id = dept.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id;

GRANT SELECT ON public.contract_offer_details TO authenticated;
GRANT SELECT ON public.contract_offer_details TO anon;

COMMENT ON VIEW public.contract_offer_details IS 'Simplified view for contract offer details with related contract, candidate, sender, company, and job fields expected by API routes'; 