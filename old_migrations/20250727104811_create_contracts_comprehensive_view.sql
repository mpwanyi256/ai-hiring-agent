-- Migration: Create Contracts Comprehensive View
-- This creates a view that properly handles all contract relationships for easy querying

-- First, ensure the contracts table exists (in case the previous migration wasn't applied)
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_title_id UUID REFERENCES public.job_titles(id),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    employment_type_id UUID REFERENCES public.employment_types(id),
    contract_duration INTERVAL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the comprehensive contracts view
CREATE OR REPLACE VIEW public.contracts_comprehensive AS
SELECT 
    c.id,
    c.company_id,
    c.job_title_id,
    c.title,
    c.body,
    c.employment_type_id,
    c.contract_duration,
    c.created_by,
    c.created_at,
    c.updated_at,
    -- Job title information
    jt.id as job_title_id_ref,
    jt.name as job_title_name,
    -- Employment type information
    et.id as employment_type_id_ref,
    et.name as employment_type_name,
    -- Created by profile information
    p.id as created_by_profile_id,
    p.first_name as created_by_first_name,
    p.last_name as created_by_last_name,
    p.email as created_by_email,
    -- Company information
    comp.id as company_id_ref,
    comp.name as company_name,
    comp.slug as company_slug
FROM public.contracts c
LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
LEFT JOIN public.profiles p ON c.created_by = p.id
LEFT JOIN public.companies comp ON c.company_id = comp.id;

-- Create indexes for better performance on the original table
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_job_title_id ON public.contracts(job_title_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employment_type_id ON public.contracts(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON public.contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_title ON public.contracts(title);

-- Enable RLS on contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contracts table
DROP POLICY IF EXISTS "Users can view contracts from their company" ON public.contracts;
DROP POLICY IF EXISTS "Users can create contracts for their company" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts they created in their company" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts they created in their company" ON public.contracts;

CREATE POLICY "Users can view contracts from their company" ON public.contracts
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create contracts for their company" ON public.contracts
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can update contracts they created in their company" ON public.contracts
    FOR UPDATE USING (
        company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
        created_by = auth.uid()
    ) WITH CHECK (
        company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can delete contracts they created in their company" ON public.contracts
    FOR DELETE USING (
        company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()) AND
        created_by = auth.uid()
    );

-- Grant necessary permissions
GRANT SELECT ON public.contracts_comprehensive TO authenticated;
GRANT SELECT ON public.contracts_comprehensive TO anon;

-- Add comments
COMMENT ON VIEW public.contracts_comprehensive IS 'Comprehensive view of contracts with all related information for easy querying';
COMMENT ON TABLE public.contracts IS 'Contract templates that can be reused for multiple candidates';

-- Create a function for paginated contract fetching
CREATE OR REPLACE FUNCTION public.get_contracts_paginated(
    company_id_param UUID,
    search_term TEXT DEFAULT NULL,
    job_title_filter UUID DEFAULT NULL,
    employment_type_filter UUID DEFAULT NULL,
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    company_id UUID,
    title VARCHAR(255),
    body TEXT,
    contract_duration INTERVAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    job_title_id UUID,
    job_title_name VARCHAR(150),
    employment_type_id UUID,
    employment_type_name VARCHAR(100),
    created_by_profile_id UUID,
    created_by_first_name VARCHAR(100),
    created_by_last_name VARCHAR(100),
    created_by_email VARCHAR(255),
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    offset_val INTEGER;
    total_records BIGINT;
BEGIN
    -- Calculate offset
    offset_val := (page_number - 1) * page_size;
    
    -- Get total count first
    SELECT COUNT(*) INTO total_records
    FROM public.contracts_comprehensive cc
    WHERE cc.company_id = company_id_param
    AND (search_term IS NULL OR LOWER(cc.title) LIKE LOWER('%' || search_term || '%'))
    AND (job_title_filter IS NULL OR cc.job_title_id = job_title_filter)
    AND (employment_type_filter IS NULL OR cc.employment_type_id = employment_type_filter);
    
    -- Return paginated results with total count
    RETURN QUERY
    SELECT 
        cc.id,
        cc.company_id,
        cc.title,
        cc.body,
        cc.contract_duration,
        cc.created_at,
        cc.updated_at,
        cc.job_title_id,
        cc.job_title_name,
        cc.employment_type_id,
        cc.employment_type_name,
        cc.created_by_profile_id,
        cc.created_by_first_name,
        cc.created_by_last_name,
        cc.created_by_email,
        total_records
    FROM public.contracts_comprehensive cc
    WHERE cc.company_id = company_id_param
    AND (search_term IS NULL OR LOWER(cc.title) LIKE LOWER('%' || search_term || '%'))
    AND (job_title_filter IS NULL OR cc.job_title_id = job_title_filter)
    AND (employment_type_filter IS NULL OR cc.employment_type_id = employment_type_filter)
    ORDER BY cc.created_at DESC
    LIMIT page_size
    OFFSET offset_val;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_contracts_paginated TO authenticated; 

ALTER VIEW public.contracts_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.contracts_comprehensive TO authenticated;