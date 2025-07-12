-- Migration: Enhance companies table for company settings
-- Add essential fields for company profile management

-- Add new columns to companies table
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS about TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to document the new fields
COMMENT ON COLUMN public.companies.bio IS 'Short company description for public display';
COMMENT ON COLUMN public.companies.about IS 'Detailed company description';
COMMENT ON COLUMN public.companies.logo_url IS 'URL to company logo image';

-- Update RLS policies to allow users to update their company
CREATE POLICY IF NOT EXISTS "Users can update their company" ON public.companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    ); 