-- Migration: Add company_id to job_titles for company-specific job titles
-- This allows companies to manage their own custom job titles

-- 1. Add company_id column to job_titles table
ALTER TABLE public.job_titles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Remove the unique constraint on name alone since we now want unique per company
ALTER TABLE public.job_titles 
DROP CONSTRAINT IF EXISTS job_titles_name_key;

-- 3. Add new unique constraint for name + company_id (allowing global and company-specific titles)
ALTER TABLE public.job_titles 
ADD CONSTRAINT job_titles_name_company_unique UNIQUE (name, company_id);

-- 4. Create index for better performance when querying by company
CREATE INDEX IF NOT EXISTS idx_job_titles_company_id ON public.job_titles(company_id);

-- 5. Create index for global job titles (where company_id is NULL)
CREATE INDEX IF NOT EXISTS idx_job_titles_global ON public.job_titles(name) WHERE company_id IS NULL;

-- 6. Add RLS (Row Level Security) policies for job_titles
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view global job titles and their company's job titles
CREATE POLICY "Users can view job titles" ON public.job_titles
FOR SELECT
USING (
  company_id IS NULL OR 
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Users can insert job titles for their company only
CREATE POLICY "Users can create job titles for their company" ON public.job_titles
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Users can update job titles for their company only
CREATE POLICY "Users can update their company job titles" ON public.job_titles
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Users can delete job titles for their company only
CREATE POLICY "Users can delete their company job titles" ON public.job_titles
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- 7. Update the existing global job titles to have NULL company_id (they remain global)
-- This step ensures existing data continues to work as global templates

-- 8. Add updated_at trigger for job_titles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_job_titles_updated_at ON public.job_titles;

-- Create trigger for updated_at
CREATE TRIGGER update_job_titles_updated_at
    BEFORE UPDATE ON public.job_titles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON COLUMN public.job_titles.company_id IS 'Company ID for company-specific job titles. NULL for global templates.';
COMMENT ON CONSTRAINT job_titles_name_company_unique ON public.job_titles IS 'Ensures job title names are unique within a company (or globally if company_id is NULL)'; 