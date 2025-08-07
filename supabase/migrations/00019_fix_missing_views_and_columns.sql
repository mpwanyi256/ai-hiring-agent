-- Fix Missing Views and Columns Migration
-- This migration addresses all the API route errors by creating missing views and fixing column references
-- Based on old migrations structure

-- ============================================================================
-- PART 1: Fix skills and traits tables - add missing columns
-- ============================================================================

-- Add category_id column to skills table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'skills' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.skills ADD COLUMN category_id UUID;
    END IF;
END $$;

-- Add category_id column to traits table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'traits' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.traits ADD COLUMN category_id UUID;
    END IF;
END $$;

-- Add is_active column to skills table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'skills' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.skills ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add is_active column to traits table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'traits' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.traits ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================================================
-- PART 2: Create missing categories table with proper structure
-- ============================================================================

-- Drop existing categories table if it exists (to recreate with proper structure)
DROP TABLE IF EXISTS public.categories CASCADE;

-- Create categories table with proper structure from old migration
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('skill', 'trait')),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_company_id ON public.categories(company_id);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Categories are viewable by authenticated users" ON public.categories
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Add updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 3: Insert default categories for skills and traits
-- ============================================================================

-- Insert skill categories
INSERT INTO public.categories (name, type, description, sort_order) VALUES
    ('programming', 'skill', 'Programming languages and core coding skills', 1),
    ('frontend', 'skill', 'Frontend development frameworks and technologies', 2),
    ('backend', 'skill', 'Backend development frameworks and server technologies', 3),
    ('database', 'skill', 'Database management and data storage technologies', 4),
    ('devops', 'skill', 'DevOps, deployment, and infrastructure tools', 5),
    ('cloud', 'skill', 'Cloud platforms and services', 6),
    ('tools', 'skill', 'Development tools and utilities', 7),
    ('architecture', 'skill', 'Software architecture and system design', 8),
    ('ai', 'skill', 'Artificial intelligence and machine learning', 9),
    ('data', 'skill', 'Data analysis and data science', 10),
    ('quality_assurance', 'skill', 'Quality assurance and testing', 11),
    ('design', 'skill', 'UI/UX design and user experience', 12),
    ('mobile', 'skill', 'Mobile application development', 13),
    ('management', 'skill', 'Project and team management', 14),
    ('leadership_skills', 'skill', 'Leadership and mentoring skills', 15),
    ('soft_skills', 'skill', 'Soft skills and interpersonal abilities', 16),
    ('methodology', 'skill', 'Development methodologies and practices', 17)
ON CONFLICT (name) DO NOTHING;

-- Insert trait categories
INSERT INTO public.categories (name, type, description, sort_order) VALUES
    ('work_style', 'trait', 'Individual work preferences and habits', 1),
    ('collaboration', 'trait', 'Team collaboration and interpersonal skills', 2),
    ('personality', 'trait', 'Core personality characteristics', 3),
    ('performance', 'trait', 'Performance and results orientation', 4),
    ('problem_solving', 'trait', 'Problem-solving and analytical abilities', 5),
    ('thinking', 'trait', 'Thinking patterns and cognitive approaches', 6),
    ('creativity', 'trait', 'Creative and innovative capabilities', 7),
    ('communication', 'trait', 'Communication and interpersonal skills', 8),
    ('emotional_intelligence', 'trait', 'Emotional awareness and empathy', 9),
    ('service', 'trait', 'Service orientation and customer focus', 10),
    ('growth', 'trait', 'Learning and development mindset', 11),
    ('quality_focus', 'trait', 'Quality focus and attention to detail', 12),
    ('efficiency', 'trait', 'Time management and organizational skills', 13)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 4: Create missing views (skills_view, traits_view)
-- ============================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.skills_view;
DROP VIEW IF EXISTS public.traits_view;

-- Create skills_view with proper structure from old migration
CREATE VIEW public.skills_view AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.is_active,
    s.created_at,
    s.updated_at,
    s.company_id,
    c.name as category,
    c.description as category_description,
    c.sort_order as category_sort_order
FROM public.skills s
LEFT JOIN public.categories c ON s.category_id = c.id
WHERE s.is_active = true AND (c.is_active = true OR c.is_active IS NULL)
ORDER BY c.sort_order ASC, s.name ASC;

-- Create traits_view with proper structure from old migration
CREATE VIEW public.traits_view AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.is_active,
    t.created_at,
    t.updated_at,
    t.company_id,
    c.name as category,
    c.description as category_description,
    c.sort_order as category_sort_order
FROM public.traits t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE t.is_active = true AND (c.is_active = true OR c.is_active IS NULL)
ORDER BY c.sort_order ASC, t.name ASC;

-- Set security invoker for views
ALTER VIEW public.skills_view SET (security_invoker = on);
ALTER VIEW public.traits_view SET (security_invoker = on);

-- Grant permissions
GRANT SELECT ON public.skills_view TO authenticated;
GRANT SELECT ON public.traits_view TO authenticated;

-- ============================================================================
-- PART 5: Fix job_titles table - add missing 'name' column
-- ============================================================================

-- Add 'name' column to job_titles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_titles' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.job_titles ADD COLUMN name VARCHAR(150);
        
        -- Update existing records to use 'title' as 'name'
        UPDATE public.job_titles SET name = title WHERE name IS NULL;
        
        -- Make name NOT NULL after populating
        ALTER TABLE public.job_titles ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- Add unique constraint for name + company_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_titles_name_company_unique'
    ) THEN
        ALTER TABLE public.job_titles 
        ADD CONSTRAINT job_titles_name_company_unique UNIQUE (name, company_id);
    END IF;
END $$;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_titles_name ON public.job_titles(name);
CREATE INDEX IF NOT EXISTS idx_job_titles_company_name ON public.job_titles(company_id, name);

-- ============================================================================
-- PART 6: Fix employment_types table - add missing 'company_id' column
-- ============================================================================

-- Add 'company_id' column to employment_types if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employment_types' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE public.employment_types ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Add index for efficient queries
        CREATE INDEX IF NOT EXISTS idx_employment_types_company_id ON public.employment_types(company_id);
    END IF;
END $$;

-- ============================================================================
-- PART 7: Fix job_templates table - ensure it has correct structure
-- ============================================================================

-- Add missing columns to job_templates if they don't exist
DO $$ 
BEGIN
    -- Add 'user_id' column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_templates' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.job_templates ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- Populate user_id from profile_id for existing records
        UPDATE public.job_templates SET user_id = profile_id WHERE user_id IS NULL;
        
        -- Add index
        CREATE INDEX IF NOT EXISTS idx_job_templates_user_id ON public.job_templates(user_id);
    END IF;
END $$;

-- ============================================================================
-- PART 8: Update RLS policies for job_titles and employment_types
-- ============================================================================

-- Enable RLS for job_titles if not already enabled
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_titles
DROP POLICY IF EXISTS "Users can view job titles" ON public.job_titles;
CREATE POLICY "Users can view job titles" ON public.job_titles
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = job_titles.company_id
        )
    );

DROP POLICY IF EXISTS "Users can create job titles for their company" ON public.job_titles;
CREATE POLICY "Users can create job titles for their company" ON public.job_titles
    FOR INSERT WITH CHECK (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = job_titles.company_id
        )
    );

-- Enable RLS for employment_types if not already enabled
ALTER TABLE public.employment_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for employment_types
DROP POLICY IF EXISTS "Users can view employment types" ON public.employment_types;
CREATE POLICY "Users can view employment types" ON public.employment_types
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = employment_types.company_id
        )
    );

-- ============================================================================
-- PART 9: Create job_templates view for API compatibility
-- ============================================================================

DROP VIEW IF EXISTS public.job_templates_view;
CREATE VIEW public.job_templates_view AS
SELECT 
    jt.id,
    jt.profile_id,
    jt.user_id,
    jt.name,
    jt.title,
    jt.description,
    jt.requirements,
    jt.template_data,
    jt.is_public,
    jt.usage_count,
    jt.created_at,
    jt.updated_at,
    p.first_name,
    p.last_name,
    p.email,
    p.company_id
FROM public.job_templates jt
LEFT JOIN public.profiles p ON jt.profile_id = p.id
WHERE jt.is_public = true OR jt.profile_id = auth.uid();

-- Set security invoker for the view
ALTER VIEW public.job_templates_view SET (security_invoker = on);

-- Grant permissions
GRANT SELECT ON public.job_templates_view TO authenticated;

-- ============================================================================
-- PART 10: Add helpful comments
-- ============================================================================

COMMENT ON VIEW public.skills_view IS 'Enhanced view of skills with category information and company filtering support';
COMMENT ON VIEW public.traits_view IS 'Enhanced view of traits with category information and company filtering support';
COMMENT ON VIEW public.job_templates_view IS 'View of job templates with user information for API compatibility';
COMMENT ON TABLE public.categories IS 'Categories for organizing skills and traits';
COMMENT ON COLUMN public.job_titles.name IS 'Job title name (for API compatibility)';
COMMENT ON COLUMN public.employment_types.company_id IS 'Company ID for company-specific employment types';
COMMENT ON COLUMN public.job_templates.user_id IS 'User ID for backward compatibility with API routes';
COMMENT ON COLUMN public.skills.category_id IS 'Reference to the category this skill belongs to';
COMMENT ON COLUMN public.traits.category_id IS 'Reference to the category this trait belongs to'; 