-- Fix Job Templates Structure Migration
-- This migration fixes the job_templates table to match the original structure from old migrations

-- ============================================================================
-- PART 1: Add missing columns to job_templates table
-- ============================================================================

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_templates' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.job_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add fields column if it doesn't exist (JSONB for job configuration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_templates' AND column_name = 'fields'
    ) THEN
        ALTER TABLE public.job_templates ADD COLUMN fields JSONB;
    END IF;
END $$;

-- Add interview_format column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_templates' AND column_name = 'interview_format'
    ) THEN
        ALTER TABLE public.job_templates ADD COLUMN interview_format VARCHAR(20) DEFAULT 'text';
    END IF;
END $$;

-- ============================================================================
-- PART 2: Add missing indexes for job_templates
-- ============================================================================

-- Add index for is_active column
CREATE INDEX IF NOT EXISTS idx_job_templates_active ON public.job_templates(is_active) WHERE is_active = true;

-- Add index for name column
CREATE INDEX IF NOT EXISTS idx_job_templates_name ON public.job_templates(name);

-- ============================================================================
-- PART 3: Add unique constraint for user_id + name
-- ============================================================================

-- Add unique constraint for template name per user
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_template_name_per_user'
    ) THEN
        ALTER TABLE public.job_templates 
        ADD CONSTRAINT unique_template_name_per_user UNIQUE (user_id, name);
    END IF;
END $$;

-- ============================================================================
-- PART 4: Update RLS policies for job_templates
-- ============================================================================

-- Enable RLS for job_templates if not already enabled
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own job templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can create their own job templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can update their own job templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can delete their own job templates" ON public.job_templates;

-- RLS policies for job templates (users can manage their own templates)
CREATE POLICY "Users can view their own job templates" ON public.job_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job templates" ON public.job_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job templates" ON public.job_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job templates" ON public.job_templates
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 5: Update job_templates_view to include all columns
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
    jt.fields,
    jt.interview_format,
    jt.is_public,
    jt.is_active,
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
-- PART 6: Add helpful comments
-- ============================================================================

COMMENT ON COLUMN public.job_templates.is_active IS 'Whether the job template is active and available for use';
COMMENT ON COLUMN public.job_templates.fields IS 'JSONB containing job configuration: skills, traits, experience_level, job_description, custom_fields';
COMMENT ON COLUMN public.job_templates.interview_format IS 'Format for interviews: text, video, audio, etc.';
COMMENT ON VIEW public.job_templates_view IS 'View of job templates with user information for API compatibility'; 