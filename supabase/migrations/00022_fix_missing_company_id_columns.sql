-- Fix Missing Company ID Columns Migration
-- This migration adds missing company_id columns and updates constraints to match old migrations

-- ============================================================================
-- PART 1: Add company_id to departments table
-- ============================================================================

-- Add company_id column to departments if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE public.departments 
        ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- PART 2: Update unique constraints for departments
-- ============================================================================

-- Drop existing unique constraint on name alone
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'departments' AND constraint_name = 'departments_name_key'
    ) THEN
        ALTER TABLE public.departments DROP CONSTRAINT departments_name_key;
    END IF;
END $$;

-- Add new unique constraint that includes company_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'departments' AND constraint_name = 'departments_name_company_unique'
    ) THEN
        ALTER TABLE public.departments 
        ADD CONSTRAINT departments_name_company_unique 
        UNIQUE (name, company_id);
    END IF;
END $$;

-- ============================================================================
-- PART 3: Update unique constraints for employment_types
-- ============================================================================

-- Drop existing unique constraint on name alone
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'employment_types' AND constraint_name = 'employment_types_name_key'
    ) THEN
        ALTER TABLE public.employment_types DROP CONSTRAINT employment_types_name_key;
    END IF;
END $$;

-- Add new unique constraint that includes company_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'employment_types' AND constraint_name = 'employment_types_name_company_unique'
    ) THEN
        ALTER TABLE public.employment_types 
        ADD CONSTRAINT employment_types_name_company_unique 
        UNIQUE (name, company_id);
    END IF;
END $$;

-- ============================================================================
-- PART 4: Update unique constraints for skills
-- ============================================================================

-- Drop existing unique constraint on name alone
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'skills' AND constraint_name = 'skills_name_key'
    ) THEN
        ALTER TABLE public.skills DROP CONSTRAINT skills_name_key;
    END IF;
END $$;

-- Add new unique constraint that includes company_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'skills' AND constraint_name = 'skills_name_company_unique'
    ) THEN
        ALTER TABLE public.skills 
        ADD CONSTRAINT skills_name_company_unique 
        UNIQUE (name, company_id);
    END IF;
END $$;

-- Allow null company_id for global skills
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'skills_name_global_unique'
    ) THEN
        CREATE UNIQUE INDEX skills_name_global_unique 
        ON public.skills (name) 
        WHERE company_id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- PART 5: Update unique constraints for traits
-- ============================================================================

-- Drop existing unique constraint on name alone
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'traits' AND constraint_name = 'traits_name_key'
    ) THEN
        ALTER TABLE public.traits DROP CONSTRAINT traits_name_key;
    END IF;
END $$;

-- Add new unique constraint that includes company_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'traits' AND constraint_name = 'traits_name_company_unique'
    ) THEN
        ALTER TABLE public.traits 
        ADD CONSTRAINT traits_name_company_unique 
        UNIQUE (name, company_id);
    END IF;
END $$;

-- Allow null company_id for global traits
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'traits_name_global_unique'
    ) THEN
        CREATE UNIQUE INDEX traits_name_global_unique 
        ON public.traits (name) 
        WHERE company_id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- PART 6: Add missing indexes
-- ============================================================================

-- Add index for departments company_id
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);

-- Add index for employment_types company_id
CREATE INDEX IF NOT EXISTS idx_employment_types_company_id ON public.employment_types(company_id);

-- Add index for skills company_id
CREATE INDEX IF NOT EXISTS idx_skills_company_id ON public.skills(company_id);

-- Add index for traits company_id
CREATE INDEX IF NOT EXISTS idx_traits_company_id ON public.traits(company_id);

-- ============================================================================
-- PART 7: Update RLS policies for departments
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Departments are viewable by authenticated users" ON public.departments;

-- Create new RLS policies for departments
CREATE POLICY "Users can view departments" ON public.departments
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = departments.company_id
        )
    );

CREATE POLICY "Users can create departments for their company" ON public.departments
    FOR INSERT WITH CHECK (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = departments.company_id
        )
    );

CREATE POLICY "Users can update their company departments" ON public.departments
    FOR UPDATE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = departments.company_id
        )
    );

CREATE POLICY "Users can delete their company departments" ON public.departments
    FOR DELETE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = departments.company_id
        )
    );

-- ============================================================================
-- PART 8: Update RLS policies for employment_types
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view employment types" ON public.employment_types;

-- Create new RLS policies for employment_types
CREATE POLICY "Users can view employment types" ON public.employment_types
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = employment_types.company_id
        )
    );

CREATE POLICY "Users can create employment types for their company" ON public.employment_types
    FOR INSERT WITH CHECK (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = employment_types.company_id
        )
    );

CREATE POLICY "Users can update their company employment types" ON public.employment_types
    FOR UPDATE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = employment_types.company_id
        )
    );

CREATE POLICY "Users can delete their company employment types" ON public.employment_types
    FOR DELETE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = employment_types.company_id
        )
    );

-- ============================================================================
-- PART 9: Update RLS policies for skills
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Skills are viewable by authenticated users" ON public.skills;

-- Create new RLS policies for skills
CREATE POLICY "Users can view skills" ON public.skills
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = skills.company_id
        )
    );

CREATE POLICY "Users can create skills for their company" ON public.skills
    FOR INSERT WITH CHECK (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = skills.company_id
        )
    );

CREATE POLICY "Users can update their company skills" ON public.skills
    FOR UPDATE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = skills.company_id
        )
    );

CREATE POLICY "Users can delete their company skills" ON public.skills
    FOR DELETE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = skills.company_id
        )
    );

-- ============================================================================
-- PART 10: Update RLS policies for traits
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Traits are viewable by authenticated users" ON public.traits;

-- Create new RLS policies for traits
CREATE POLICY "Users can view traits" ON public.traits
    FOR SELECT USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = traits.company_id
        )
    );

CREATE POLICY "Users can create traits for their company" ON public.traits
    FOR INSERT WITH CHECK (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = traits.company_id
        )
    );

CREATE POLICY "Users can update their company traits" ON public.traits
    FOR UPDATE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = traits.company_id
        )
    );

CREATE POLICY "Users can delete their company traits" ON public.traits
    FOR DELETE USING (
        company_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND company_id = traits.company_id
        )
    );

-- ============================================================================
-- PART 11: Update permissions
-- ============================================================================

-- Grant permissions for departments
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;

-- Grant permissions for employment_types
GRANT INSERT, UPDATE, DELETE ON public.employment_types TO authenticated;

-- Grant permissions for skills
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;

-- Grant permissions for traits
GRANT INSERT, UPDATE, DELETE ON public.traits TO authenticated;

-- ============================================================================
-- PART 12: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.departments.company_id IS 'Reference to company for company-specific departments (NULL for global)';
COMMENT ON COLUMN public.employment_types.company_id IS 'Reference to company for company-specific employment types (NULL for global)';
COMMENT ON COLUMN public.skills.company_id IS 'Reference to company for company-specific skills (NULL for global)';
COMMENT ON COLUMN public.traits.company_id IS 'Reference to company for company-specific traits (NULL for global)'; 