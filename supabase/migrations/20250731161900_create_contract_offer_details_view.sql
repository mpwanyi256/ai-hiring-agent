-- Create a comprehensive view for contract offer details
-- This view joins all necessary tables to provide complete contract offer information

CREATE OR REPLACE VIEW public.contract_offer_details AS
SELECT 
    co.id,
    co.status,
    co.salary_amount,
    co.salary_currency,
    co.start_date,
    co.end_date,
    co.expires_at,
    co.sent_at,
    co.signed_at,
    co.rejected_at,
    co.additional_terms,
    co.signing_token,
    co.contract_id,
    co.candidate_id,
    co.sent_by,
    co.created_at,
    co.updated_at,
    
    -- Contract details
    c.title as contract_title,
    c.body as contract_body,
    c.company_id as contract_company_id,
    
    -- Job title and employment type
    jt.name as job_title_name,
    et.name as employment_type_name,
    
    -- Candidate details
    ci.first_name as candidate_first_name,
    ci.last_name as candidate_last_name,
    ci.email as candidate_email,
    
    -- Sender profile details
    p.first_name as sender_first_name,
    p.last_name as sender_last_name,
    p.email as sender_email,
    
    -- Company details
    comp.name as company_name
    
FROM public.contract_offers co
LEFT JOIN public.contracts c ON co.contract_id = c.id
LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
LEFT JOIN public.candidates cand ON co.candidate_id = cand.id
LEFT JOIN public.candidates_info ci ON cand.candidate_info_id = ci.id
LEFT JOIN public.profiles p ON co.sent_by = p.id
LEFT JOIN public.companies comp ON p.company_id = comp.id;

-- Grant access to the view
GRANT SELECT ON public.contract_offer_details TO authenticated;
GRANT SELECT ON public.contract_offer_details TO anon;

-- Note: Views don't support RLS directly - access control is handled by the underlying table policies

-- Update RLS policies for underlying tables to allow access for the view

-- Update candidates table RLS to allow access for contract signing
CREATE POLICY "Allow candidates access for contract signing" ON public.candidates
    FOR SELECT
    TO anon
    USING (
        -- Allow access if candidate is part of a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers 
            WHERE candidate_id = candidates.id
        )
    );

-- Update contracts table RLS to allow access for contract signing
CREATE POLICY "Allow contracts access for contract signing" ON public.contracts
    FOR SELECT
    TO anon
    USING (
        -- Allow access if contract is part of a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers 
            WHERE contract_id = contracts.id
        )
    );

-- Update profiles table RLS to allow access for contract signing
CREATE POLICY "Allow profiles access for contract signing" ON public.profiles
    FOR SELECT
    TO anon
    USING (
        -- Allow access if profile is the sender of a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers 
            WHERE sent_by = profiles.id
        )
    );

-- Update companies table RLS to allow access for contract signing
CREATE POLICY "Allow companies access for contract signing" ON public.companies
    FOR SELECT
    TO anon
    USING (
        -- Allow access if company is related to a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers co
            LEFT JOIN public.profiles p ON co.sent_by = p.id
            WHERE p.company_id = companies.id
        )
    );

-- Update job_titles table RLS to allow access for contract signing
CREATE POLICY "Allow job_titles access for contract signing" ON public.job_titles
    FOR SELECT
    TO anon
    USING (
        -- Allow access if job title is used in a contract that's part of a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers co
            LEFT JOIN public.contracts c ON co.contract_id = c.id
            WHERE c.job_title_id = job_titles.id
        )
    );

-- Update employment_types table RLS to allow access for contract signing
CREATE POLICY "Allow employment_types access for contract signing" ON public.employment_types
    FOR SELECT
    TO anon
    USING (
        -- Allow access if employment type is used in a contract that's part of a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers co
            LEFT JOIN public.contracts c ON co.contract_id = c.id
            WHERE c.employment_type_id = employment_types.id
        )
    );

-- Update candidates_info table RLS to allow access for contract signing
CREATE POLICY "Allow candidates_info access for contract signing" ON public.candidates_info
    FOR SELECT
    TO anon
    USING (
        -- Allow access if candidate info is related to a candidate in a contract offer
        EXISTS (
            SELECT 1 FROM public.contract_offers co
            LEFT JOIN public.candidates cand ON co.candidate_id = cand.id
            WHERE cand.candidate_info_id = candidates_info.id
        )
    );

-- Create indexes for better performance on the view
CREATE INDEX IF NOT EXISTS idx_contract_offers_signing_token ON public.contract_offers(signing_token);
CREATE INDEX IF NOT EXISTS idx_contract_offers_candidate_id ON public.contract_offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_contract_id ON public.contract_offers(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_offers_sent_by ON public.contract_offers(sent_by);
