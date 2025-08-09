-- Migration: Create job-level permissions for team members
-- This migration adds the ability to assign team members to specific jobs

-- Create job_permissions table
CREATE TABLE IF NOT EXISTS public.job_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permission_level TEXT NOT NULL DEFAULT 'viewer' CHECK (permission_level IN ('viewer', 'interviewer', 'manager', 'admin')),
    granted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique permissions per user per job
    UNIQUE(job_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_permissions_job_id ON public.job_permissions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_user_id ON public.job_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_level ON public.job_permissions(permission_level);
CREATE INDEX IF NOT EXISTS idx_job_permissions_granted_by ON public.job_permissions(granted_by);

-- Enable Row Level Security
ALTER TABLE public.job_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_permissions
-- Users can view permissions for jobs in their company
CREATE POLICY "Users can view job permissions in their company" ON public.job_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p1, profiles p2, jobs j
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
            SELECT 1 FROM profiles p, jobs j
            WHERE p.id = auth.uid()
            AND j.id = job_permissions.job_id
            AND (
                j.profile_id = p.id  -- Job owner
                OR p.role = 'admin'  -- Company admin
            )
        )
    );

-- Create function to automatically grant job permissions to job creator
CREATE OR REPLACE FUNCTION grant_job_creator_permissions()
RETURNS TRIGGER AS $$
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-grant permissions when job is created
DROP TRIGGER IF EXISTS grant_job_creator_permissions_trigger ON public.jobs;
CREATE TRIGGER grant_job_creator_permissions_trigger
    AFTER INSERT ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION grant_job_creator_permissions();

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION grant_job_creator_permissions() TO service_role;
GRANT EXECUTE ON FUNCTION grant_job_creator_permissions() TO postgres;

-- Add updated_at trigger for job_permissions
DROP TRIGGER IF EXISTS update_job_permissions_updated_at ON public.job_permissions;
CREATE TRIGGER update_job_permissions_updated_at
    BEFORE UPDATE ON public.job_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for job permissions with user details
CREATE OR REPLACE VIEW job_permissions_detailed AS
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

-- Set security invoker for the view
ALTER VIEW job_permissions_detailed SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON job_permissions_detailed TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.job_permissions IS 'Assigns team members to specific jobs with different permission levels';
COMMENT ON COLUMN public.job_permissions.permission_level IS 'Permission level: viewer (read-only), interviewer (can conduct interviews), manager (can manage candidates), admin (full control)';
COMMENT ON VIEW job_permissions_detailed IS 'Detailed view of job permissions with user and job information'; 