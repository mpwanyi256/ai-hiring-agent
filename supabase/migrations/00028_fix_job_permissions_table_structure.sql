-- Fix Job Permissions Table Structure Migration
-- This migration fixes the job_permissions table to match the original design

-- ============================================================================
-- PART 1: Add missing columns to job_permissions table
-- ============================================================================

-- Add granted_at column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.job_permissions ADD COLUMN granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add updated_at column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.job_permissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- ============================================================================
-- PART 2: Rename permission_type to permission_level
-- ============================================================================

-- Rename the column from permission_type to permission_level
DO $$ BEGIN
    ALTER TABLE public.job_permissions RENAME COLUMN permission_type TO permission_level;
EXCEPTION WHEN undefined_column THEN 
    -- If permission_type doesn't exist, check if permission_level already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_permissions' 
        AND column_name = 'permission_level'
    ) THEN
        -- Add permission_level column if neither exists
        ALTER TABLE public.job_permissions ADD COLUMN permission_level TEXT NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'interviewer', 'manager', 'admin'));
    END IF;
END $$;

-- ============================================================================
-- PART 3: Add unique constraint if it doesn't exist
-- ============================================================================

-- Add unique constraint for job_id and user_id
DO $$ BEGIN
    ALTER TABLE public.job_permissions ADD CONSTRAINT job_permissions_job_user_unique UNIQUE (job_id, user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- PART 4: Create missing indexes
-- ============================================================================

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_permissions_job_id ON public.job_permissions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_user_id ON public.job_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_level ON public.job_permissions(permission_level);
CREATE INDEX IF NOT EXISTS idx_job_permissions_granted_by ON public.job_permissions(granted_by);

-- ============================================================================
-- PART 5: Enable RLS and create policies for job_permissions
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.job_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view job permissions in their company" ON public.job_permissions;
DROP POLICY IF EXISTS "Job owners can manage permissions" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can manage job permissions for their jobs" ON public.job_permissions;
DROP POLICY IF EXISTS "Users can view job permissions for their accessible jobs" ON public.job_permissions;

-- Users can view permissions for jobs in their company
CREATE POLICY "Users can view job permissions in their company" ON public.job_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p1, public.profiles p2, public.jobs j
            WHERE p1.id = auth.uid()
            AND p2.id = job_permissions.user_id
            AND j.id = job_permissions.job_id
            AND j.profile_id = p1.id
            AND p1.company_id = p2.company_id
        )
    );

-- Job owners and admins can manage permissions
CREATE POLICY "Job owners can manage permissions" ON public.job_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p, public.jobs j
            WHERE p.id = auth.uid()
            AND j.id = job_permissions.job_id
            AND (
                j.profile_id = p.id  -- Job owner
                OR p.role = 'admin'  -- Company admin
            )
        )
    );

-- ============================================================================
-- PART 6: Create job_permissions_detailed view
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.job_permissions_detailed CASCADE;

-- Create view for job permissions with user details
CREATE OR REPLACE VIEW public.job_permissions_detailed AS
SELECT 
    jp.id,
    jp.job_id,
    jp.user_id,
    jp.permission_level,
    jp.granted_at,
    jp.created_at,
    jp.updated_at,
    -- User details
    p.first_name,
    p.last_name,
    p.email,
    p.role as user_role,
    -- Job details
    j.title as job_title,
    j.profile_id as job_owner_id,
    -- Granted by details
    granter.first_name as granted_by_first_name,
    granter.last_name as granted_by_last_name
FROM public.job_permissions jp
JOIN public.profiles p ON jp.user_id = p.id
JOIN public.jobs j ON jp.job_id = j.id
JOIN public.profiles granter ON jp.granted_by = granter.id;

-- ============================================================================
-- PART 7: Set security invoker and grant permissions
-- ============================================================================

-- Set security invoker for the view
ALTER VIEW public.job_permissions_detailed SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON public.job_permissions_detailed TO authenticated;

-- Grant permissions for job_permissions table
GRANT ALL ON public.job_permissions TO authenticated;

-- ============================================================================
-- PART 8: Add updated_at trigger for job_permissions
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_job_permissions_updated_at ON public.job_permissions;

-- Create trigger for job_permissions updated_at
CREATE TRIGGER update_job_permissions_updated_at
    BEFORE UPDATE ON public.job_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 9: Fix the grant_job_creator_permissions function
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.grant_job_creator_permissions() CASCADE;

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION public.grant_job_creator_permissions()
RETURNS TRIGGER AS $$
DECLARE
    creator_company_id UUID;
    creator_name TEXT;
BEGIN
    -- Grant admin permissions to the job creator
    INSERT INTO public.job_permissions (
        job_id,
        user_id,
        permission_level,
        granted_by
    ) VALUES (
        NEW.id,
        NEW.profile_id,
        'admin',
        NEW.profile_id
    );
    
    -- Get the company_id and name of the job creator
    SELECT company_id, first_name || ' ' || COALESCE(last_name, '')
    INTO creator_company_id, creator_name
    FROM public.profiles 
    WHERE id = NEW.profile_id;
    
    -- Create notifications for all users in the same company
    INSERT INTO public.notifications (
        user_id,
        company_id,
        type,
        category,
        title,
        message,
        related_entity_type,
        related_entity_id,
        metadata
    )
    SELECT 
        p.id,
        creator_company_id,
        'info',
        'job',
        'New Job Posted',
        CASE 
            WHEN p.id = NEW.profile_id THEN 'Your job "' || NEW.title || '" has been created successfully.'
            ELSE creator_name || ' posted a new job: "' || NEW.title || '"'
        END,
        'job',
        NEW.id,
        jsonb_build_object(
            'job_id', NEW.id,
            'job_title', NEW.title,
            'created_by', creator_name,
            'creator_id', NEW.profile_id,
            'is_creator', p.id = NEW.profile_id
        )
    FROM public.profiles p
    WHERE p.company_id = creator_company_id
      AND p.id IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 10: Grant permissions on the function
-- ============================================================================

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.grant_job_creator_permissions() TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_job_creator_permissions() TO postgres;

-- ============================================================================
-- PART 11: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.job_permissions IS 'Assigns team members to specific jobs with different permission levels';
COMMENT ON COLUMN public.job_permissions.permission_level IS 'Permission level: viewer (read-only), interviewer (can conduct interviews), manager (can manage candidates), admin (full control)';
COMMENT ON COLUMN public.job_permissions.granted_at IS 'When the permission was granted';
COMMENT ON COLUMN public.job_permissions.granted_by IS 'Who granted this permission';
COMMENT ON VIEW public.job_permissions_detailed IS 'Detailed view of job permissions with user and job information';

-- ============================================================================
-- PART 12: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    view_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check column count
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'job_permissions' 
    AND table_schema = 'public';
    
    -- Check if view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'job_permissions_detailed' 
        AND table_schema = 'public'
    ) INTO view_exists;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'grant_job_creator_permissions' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    RAISE NOTICE '✅ Job permissions table structure fixed successfully';
    RAISE NOTICE '  - Column count: %', column_count;
    RAISE NOTICE '  - View exists: %', view_exists;
    RAISE NOTICE '  - Function exists: %', function_exists;
    RAISE NOTICE '  - Job creation should now work correctly';
END $$; 