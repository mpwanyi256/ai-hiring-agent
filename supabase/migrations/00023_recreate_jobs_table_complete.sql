-- Recreate Jobs Table Complete Migration
-- This migration recreates the jobs table with all fields and views from old migrations

-- ============================================================================
-- PART 1: Drop existing views and tables that depend on jobs
-- ============================================================================

-- Drop views first
DROP VIEW IF EXISTS public.jobs_comprehensive CASCADE;
DROP VIEW IF EXISTS public.jobs_detailed CASCADE;
DROP VIEW IF EXISTS public.user_jobs CASCADE;
DROP VIEW IF EXISTS public.company_jobs CASCADE;
DROP VIEW IF EXISTS public.accessible_jobs CASCADE;

-- ============================================================================
-- PART 2: Create enums for job fields
-- ============================================================================

-- Create workplace_type enum
DO $$ BEGIN
    CREATE TYPE workplace_type AS ENUM ('on_site', 'remote', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create job_type enum
DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'volunteer', 'internship', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- PART 3: Drop and recreate jobs table with complete structure
-- ============================================================================

-- Drop existing jobs table
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Create jobs table with complete structure from old migrations
CREATE TABLE public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    location TEXT,
    salary_range TEXT,
    employment_type TEXT,
    status TEXT DEFAULT 'draft',
    fields JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    interview_format VARCHAR(10) DEFAULT 'text' CHECK (interview_format IN ('text', 'video')),
    interview_token VARCHAR(255) UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
    is_active BOOLEAN DEFAULT true,
    
    -- Enhanced job fields from 20250713000000_enhance_job_fields.sql
    department_id UUID REFERENCES public.departments(id),
    job_title_id UUID REFERENCES public.job_titles(id),
    employment_type_id UUID REFERENCES public.employment_types(id),
    workplace_type workplace_type,
    job_type job_type,
    
    -- Salary fields from 20250804000000_enhance_job_creation_company_specific.sql
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'yearly' CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 4: Create indexes for jobs table
-- ============================================================================

-- Basic indexes
CREATE INDEX idx_jobs_profile_id ON public.jobs(profile_id);
CREATE INDEX idx_jobs_interview_token ON public.jobs(interview_token);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);

-- Enhanced job field indexes
CREATE INDEX idx_jobs_department_id ON public.jobs(department_id);
CREATE INDEX idx_jobs_job_title_id ON public.jobs(job_title_id);
CREATE INDEX idx_jobs_employment_type_id ON public.jobs(employment_type_id);
CREATE INDEX idx_jobs_workplace_type ON public.jobs(workplace_type);
CREATE INDEX idx_jobs_job_type ON public.jobs(job_type);

-- ============================================================================
-- PART 5: Add updated_at trigger for jobs
-- ============================================================================

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 6: Create jobs_comprehensive view
-- ============================================================================

CREATE VIEW public.jobs_comprehensive AS
SELECT 
    -- Job fields
    j.id,
    j.profile_id,
    j.title,
    j.description,
    j.requirements,
    j.location,
    j.salary_range,
    j.employment_type,
    j.status,
    j.fields,
    j.settings,
    j.interview_format,
    j.interview_token,
    j.is_active,
    j.created_at,
    j.updated_at,
    
    -- Enhanced job fields
    j.department_id,
    j.job_title_id,
    j.employment_type_id,
    j.workplace_type,
    j.job_type,
    
    -- Salary fields
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    j.salary_period,
    
    -- Creator details as JSON object
    jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'role', p.role,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) as creator_details,
    
    -- Company details
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    
    -- Department details
    d.name as department_name,
    
    -- Job title details
    jt.name as job_title_name,
    
    -- Employment type details
    et.name as employment_type_name,
    
    -- Candidate count
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
    COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews,
    
    -- Response and evaluation counts
    COALESCE(response_stats.response_count, 0) as response_count,
    COALESCE(evaluation_stats.evaluation_count, 0) as evaluation_count,
    COALESCE(evaluation_stats.average_score, 0) as average_score

FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.departments d ON j.department_id = d.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count,
        COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as completed_interviews
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id
LEFT JOIN (
    SELECT 
        ca.job_id,
        COUNT(r.id) as response_count
    FROM public.candidates ca
    LEFT JOIN public.responses r ON ca.id = r.candidate_id
    GROUP BY ca.job_id
) response_stats ON j.id = response_stats.job_id
LEFT JOIN (
    SELECT 
        ca.job_id,
        COUNT(e.id) as evaluation_count,
        ROUND(AVG(e.score), 2) as average_score
    FROM public.candidates ca
    LEFT JOIN public.evaluations e ON ca.id = e.candidate_id
    GROUP BY ca.job_id
) evaluation_stats ON j.id = evaluation_stats.job_id;

-- ============================================================================
-- PART 7: Create jobs_detailed view
-- ============================================================================

CREATE VIEW public.jobs_detailed AS
SELECT 
    j.*,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    c.name as company_name_full,
    c.slug as company_slug,
    d.name as department_name,
    jt.name as job_title_name,
    et.name as employment_type_name,
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
    COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.departments d ON j.department_id = d.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count,
        COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as completed_interviews
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id;

-- ============================================================================
-- PART 8: Create user_jobs view
-- ============================================================================

CREATE VIEW public.user_jobs AS
SELECT 
    j.*,
    p.first_name,
    p.last_name,
    p.email,
    c.name as company_name,
    c.slug as company_slug,
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id
WHERE j.profile_id = auth.uid();

-- ============================================================================
-- PART 9: Create company_jobs view
-- ============================================================================

CREATE VIEW public.company_jobs AS
SELECT 
    j.*,
    p.first_name,
    p.last_name,
    p.email,
    c.name as company_name,
    c.slug as company_slug,
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id
WHERE c.id = (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
);

-- ============================================================================
-- PART 10: Create accessible_jobs view for RLS
-- ============================================================================

CREATE VIEW public.accessible_jobs AS
SELECT j.*
FROM public.jobs j
WHERE public.user_can_access_job(j.id, auth.uid());

-- ============================================================================
-- PART 11: Set security invoker for views
-- ============================================================================

ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);
ALTER VIEW public.jobs_detailed SET (security_invoker = on);
ALTER VIEW public.user_jobs SET (security_invoker = on);
ALTER VIEW public.company_jobs SET (security_invoker = on);
ALTER VIEW public.accessible_jobs SET (security_invoker = on);

-- ============================================================================
-- PART 12: Enable RLS and create policies for jobs
-- ============================================================================

-- Enable RLS for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can create their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can view jobs with permissions" ON public.jobs;
DROP POLICY IF EXISTS "Anonymous users can view published jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can view accessible jobs" ON public.jobs;
DROP POLICY IF EXISTS "Team members can view jobs via permissions" ON public.jobs;

-- RLS policies for jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own jobs" ON public.jobs
    FOR DELETE USING (auth.uid() = profile_id);

-- Team members can view jobs with permissions
CREATE POLICY "Team members can view jobs with permissions" ON public.jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.job_permissions jp
            WHERE jp.job_id = jobs.id 
            AND jp.user_id = auth.uid()
        )
    );

-- Anonymous users can view published jobs
CREATE POLICY "Anonymous users can view published jobs" ON public.jobs
    FOR SELECT USING (
        status = 'published' 
        AND is_active = true
    );

-- ============================================================================
-- PART 13: Grant permissions
-- ============================================================================

-- Grant permissions for jobs table
GRANT ALL ON public.jobs TO authenticated;

-- Grant permissions for views
GRANT SELECT ON public.jobs_comprehensive TO authenticated;
GRANT SELECT ON public.jobs_detailed TO authenticated;
GRANT SELECT ON public.user_jobs TO authenticated;
GRANT SELECT ON public.company_jobs TO authenticated;
GRANT SELECT ON public.accessible_jobs TO authenticated;

-- ============================================================================
-- PART 14: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.jobs IS 'Jobs table with complete structure including enhanced fields and salary information';
COMMENT ON COLUMN public.jobs.department_id IS 'Reference to the department for this job';
COMMENT ON COLUMN public.jobs.job_title_id IS 'Reference to the job title for this job';
COMMENT ON COLUMN public.jobs.employment_type_id IS 'Reference to the employment type for this job';
COMMENT ON COLUMN public.jobs.workplace_type IS 'Workplace type for this job (on-site, remote, hybrid)';
COMMENT ON COLUMN public.jobs.job_type IS 'Job type for this job (full-time, part-time, contract, etc.)';
COMMENT ON COLUMN public.jobs.salary_min IS 'Minimum salary for the job position';
COMMENT ON COLUMN public.jobs.salary_max IS 'Maximum salary for the job position';
COMMENT ON COLUMN public.jobs.salary_currency IS 'Currency code for salary (e.g., USD, EUR)';
COMMENT ON COLUMN public.jobs.salary_period IS 'Salary period (hourly, daily, weekly, monthly, yearly)';
COMMENT ON COLUMN public.jobs.interview_format IS 'Format for interviews: text or video';
COMMENT ON COLUMN public.jobs.interview_token IS 'Unique token for interview access';
COMMENT ON COLUMN public.jobs.fields IS 'JSONB containing job configuration fields';
COMMENT ON COLUMN public.jobs.settings IS 'JSONB containing job settings';

COMMENT ON VIEW public.jobs_comprehensive IS 'Comprehensive jobs view with all job fields, creator details as JSON object, and company details';
COMMENT ON VIEW public.jobs_detailed IS 'Detailed jobs view with creator and company information';
COMMENT ON VIEW public.user_jobs IS 'Jobs view filtered for the current user';
COMMENT ON VIEW public.company_jobs IS 'Jobs view filtered for the current user company';
COMMENT ON VIEW public.accessible_jobs IS 'Jobs view showing jobs accessible to the current user via permissions'; 