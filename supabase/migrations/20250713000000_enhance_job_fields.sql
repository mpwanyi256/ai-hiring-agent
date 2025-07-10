-- Migration: Enhance job fields for richer job creation flow
-- 1. Create department, job_title, and employment_type tables
-- 2. Create enums for workplace_type and job_type
-- 3. Alter jobs table to add new fields
-- 4. Prepopulate tables with common values

-- 1. Create department table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create job_title table
CREATE TABLE IF NOT EXISTS public.job_titles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create employment_type table
CREATE TABLE IF NOT EXISTS public.employment_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create enums for workplace_type and job_type
DO $$ BEGIN
    CREATE TYPE workplace_type AS ENUM ('on_site', 'remote', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'volunteer', 'internship', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Alter jobs table to add new fields
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
    ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.job_titles(id),
    ADD COLUMN IF NOT EXISTS employment_type_id UUID REFERENCES public.employment_types(id),
    ADD COLUMN IF NOT EXISTS workplace_type workplace_type,
    ADD COLUMN IF NOT EXISTS job_type job_type;

-- 6. Prepopulate departments
INSERT INTO public.departments (name) VALUES
    ('Engineering'),
    ('Product'),
    ('Sales'),
    ('Marketing'),
    ('Customer Success'),
    ('Finance'),
    ('Human Resources'),
    ('Operations'),
    ('Legal'),
    ('IT'),
    ('Design')
ON CONFLICT (name) DO NOTHING;

-- 7. Prepopulate job_titles
INSERT INTO public.job_titles (name) VALUES
    ('Software Engineer'),
    ('Frontend Developer'),
    ('Backend Developer'),
    ('Full Stack Developer'),
    ('Product Manager'),
    ('Sales Manager'),
    ('Account Executive'),
    ('Customer Success Manager'),
    ('Marketing Specialist'),
    ('Data Scientist'),
    ('DevOps Engineer'),
    ('QA Engineer'),
    ('UI/UX Designer'),
    ('HR Manager'),
    ('Finance Analyst'),
    ('Operations Manager'),
    ('Legal Counsel'),
    ('IT Support Specialist'),
    ('Graphic Designer'),
    ('Content Writer'),
    ('Business Analyst'),
    ('Project Manager'),
    ('Recruiter'),
    ('Intern'),
    ('Chief Technology Officer'),
    ('Chief Product Officer'),
    ('Chief Executive Officer'),
    ('Chief Financial Officer'),
    ('Chief Operating Officer')
ON CONFLICT (name) DO NOTHING;

-- 8. Prepopulate employment_types
INSERT INTO public.employment_types (name) VALUES
    ('Permanent'),
    ('Temporary'),
    ('Internship'),
    ('Apprenticeship'),
    ('Freelance'),
    ('Consultant'),
    ('Volunteer')
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.departments IS 'Departments within a company (e.g., Engineering, Sales, Product, etc.)';
COMMENT ON TABLE public.job_titles IS 'Common job titles for job postings';
COMMENT ON TABLE public.employment_types IS 'Types of employment contracts';
COMMENT ON TYPE workplace_type IS 'Type of workplace: on-site, remote, or hybrid';
COMMENT ON TYPE job_type IS 'Type of job: full-time, part-time, contract, etc.';
COMMENT ON COLUMN public.jobs.department_id IS 'Reference to the department for this job';
COMMENT ON COLUMN public.jobs.job_title_id IS 'Reference to the job title for this job';
COMMENT ON COLUMN public.jobs.employment_type_id IS 'Reference to the employment type for this job';
COMMENT ON COLUMN public.jobs.workplace_type IS 'Workplace type for this job (on-site, remote, hybrid)';
COMMENT ON COLUMN public.jobs.job_type IS 'Job type for this job (full-time, part-time, contract, etc.)'; 