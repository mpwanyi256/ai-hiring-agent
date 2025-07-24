-- Migration: Fix job_permissions RLS policies
-- Allow authenticated users to read job_permissions but restrict write operations to job owners/admins

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Users can view job permissions in their company" ON public.job_permissions;
DROP POLICY IF EXISTS "Job owners can manage permissions" ON public.job_permissions;

-- Create new SELECT policy: Allow any authenticated user to read job_permissions
CREATE POLICY "Allow authenticated users to read job permissions" ON public.job_permissions
    FOR SELECT 
    TO authenticated
    USING (true);

-- Create INSERT policy: Only job owners or admins can create job permissions
CREATE POLICY "Job owners and admins can create permissions" ON public.job_permissions
    FOR INSERT 
    TO authenticated
    WITH CHECK (
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

-- Create UPDATE policy: Only job owners or admins can update job permissions
CREATE POLICY "Job owners and admins can update permissions" ON public.job_permissions
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p, jobs j
            WHERE p.id = auth.uid()
            AND j.id = job_permissions.job_id
            AND (
                j.profile_id = p.id  -- Job owner
                OR p.role = 'admin'  -- Company admin
            )
        )
    )
    WITH CHECK (
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

-- Create DELETE policy: Only job owners or admins can delete job permissions
CREATE POLICY "Job owners and admins can delete permissions" ON public.job_permissions
    FOR DELETE 
    TO authenticated
    USING (
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