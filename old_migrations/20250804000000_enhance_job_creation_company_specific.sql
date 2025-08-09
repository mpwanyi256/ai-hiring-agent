-- Migration: Enhance job creation with company-specific entries and salary fields
-- Add company_id to departments, employment_types, skills, and traits
-- Add salary fields to jobs table

-- 1. Add company_id to departments table
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Add company_id to employment_types table  
ALTER TABLE public.employment_types 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 3. Add company_id to skills table
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 4. Add company_id to traits table
ALTER TABLE public.traits 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 5. Add salary fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS salary_period VARCHAR(20) DEFAULT 'yearly' CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly'));

-- 6. Update unique constraints to allow company-specific entries
-- Drop existing unique constraints
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE public.employment_types DROP CONSTRAINT IF EXISTS employment_types_name_key;
ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS skills_name_key;
ALTER TABLE public.traits DROP CONSTRAINT IF EXISTS traits_name_key;

-- Add new unique constraints that include company_id
ALTER TABLE public.departments 
ADD CONSTRAINT departments_name_company_unique 
UNIQUE (name, company_id);

ALTER TABLE public.employment_types 
ADD CONSTRAINT employment_types_name_company_unique 
UNIQUE (name, company_id);

ALTER TABLE public.skills 
ADD CONSTRAINT skills_name_company_unique 
UNIQUE (name, company_id);

-- Allow null company_id for global skills
CREATE UNIQUE INDEX IF NOT EXISTS skills_name_global_unique 
ON public.skills (name) 
WHERE company_id IS NULL;

ALTER TABLE public.traits 
ADD CONSTRAINT traits_name_company_unique 
UNIQUE (name, company_id);

-- Allow null company_id for global traits  
CREATE UNIQUE INDEX IF NOT EXISTS traits_name_global_unique 
ON public.traits (name) 
WHERE company_id IS NULL;

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_employment_types_company_id ON public.employment_types(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_company_id ON public.skills(company_id);
CREATE INDEX IF NOT EXISTS idx_traits_company_id ON public.traits(company_id);

-- 8. Add comments for documentation
COMMENT ON COLUMN public.departments.company_id IS 'Reference to company for company-specific departments (NULL for global)';
COMMENT ON COLUMN public.employment_types.company_id IS 'Reference to company for company-specific employment types (NULL for global)';
COMMENT ON COLUMN public.skills.company_id IS 'Reference to company for company-specific skills (NULL for global)';
COMMENT ON COLUMN public.traits.company_id IS 'Reference to company for company-specific traits (NULL for global)';
COMMENT ON COLUMN public.jobs.salary_min IS 'Minimum salary for the job position';
COMMENT ON COLUMN public.jobs.salary_max IS 'Maximum salary for the job position';
COMMENT ON COLUMN public.jobs.salary_currency IS 'Currency code for salary (e.g., USD, EUR)';
COMMENT ON COLUMN public.jobs.salary_period IS 'Salary period (hourly, daily, weekly, monthly, yearly)'; 