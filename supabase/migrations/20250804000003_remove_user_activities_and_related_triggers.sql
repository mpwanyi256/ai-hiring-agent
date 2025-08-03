-- Migration: Remove user_activities table and all related triggers/functions
-- This migration removes the deprecated user_activities system in favor of the notifications table

-- ============================================================================
-- PART 1: Drop all triggers that reference user_activities
-- ============================================================================

-- Drop job-related triggers (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
        DROP TRIGGER IF EXISTS grant_job_creator_permissions_trigger ON public.jobs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_permissions') THEN
        DROP TRIGGER IF EXISTS trg_log_job_permission_granted ON public.job_permissions;
        DROP TRIGGER IF EXISTS trg_log_job_permission_updated ON public.job_permissions;
        DROP TRIGGER IF EXISTS trg_log_job_permission_revoked ON public.job_permissions;
    END IF;
END $$;

-- Drop team-related triggers (check for both 'invites' and 'team_invites' table names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invites') THEN
        DROP TRIGGER IF EXISTS trg_log_team_invite_sent ON public.invites;
        DROP TRIGGER IF EXISTS trg_log_team_invite_accepted ON public.invites;
        DROP TRIGGER IF EXISTS trg_log_team_invite_rejected ON public.invites;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_invites') THEN
        DROP TRIGGER IF EXISTS trg_log_team_invite_sent ON public.team_invites;
        DROP TRIGGER IF EXISTS trg_log_team_invite_accepted ON public.team_invites;
        DROP TRIGGER IF EXISTS trg_log_team_invite_rejected ON public.team_invites;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
        DROP TRIGGER IF EXISTS trg_log_team_member_removed ON public.team_members;
    END IF;
END $$;

-- Drop any other triggers that might reference user_activities
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activities') THEN
        DROP TRIGGER IF EXISTS update_user_activities_updated_at ON public.user_activities;
    END IF;
END $$;

-- ============================================================================
-- PART 2: Drop all functions that reference user_activities (using CASCADE)
-- ============================================================================

-- Drop job permission functions
DROP FUNCTION IF EXISTS grant_job_creator_permissions() CASCADE;
DROP FUNCTION IF EXISTS log_job_permission_granted() CASCADE;
DROP FUNCTION IF EXISTS log_job_permission_updated() CASCADE;
DROP FUNCTION IF EXISTS log_job_permission_revoked() CASCADE;

-- Drop team-related functions (using CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS log_team_invite_sent() CASCADE;
DROP FUNCTION IF EXISTS log_team_invite_accepted() CASCADE;
DROP FUNCTION IF EXISTS log_team_invite_rejected() CASCADE;
DROP FUNCTION IF EXISTS log_team_member_removed() CASCADE;

-- Drop any email notification functions that reference user_activities
DROP FUNCTION IF EXISTS process_email_notifications() CASCADE;
DROP FUNCTION IF EXISTS send_pending_email_notifications() CASCADE;

-- ============================================================================
-- PART 3: Drop views that reference user_activities
-- ============================================================================

DROP VIEW IF EXISTS public.user_activities_resolved;

-- ============================================================================
-- PART 4: Drop the user_activities table and related objects
-- ============================================================================

-- Drop all policies on user_activities
DROP POLICY IF EXISTS "Users can view their company activities" ON public.user_activities;
DROP POLICY IF EXISTS "Service role full access" ON public.user_activities;
DROP POLICY IF EXISTS "Authenticated users can read all activities" ON public.user_activities;

-- Drop all indexes on user_activities
DROP INDEX IF EXISTS idx_user_activities_user_id;
DROP INDEX IF EXISTS idx_user_activities_company_id;
DROP INDEX IF EXISTS idx_user_activities_entity;
DROP INDEX IF EXISTS idx_user_activities_created_at;
DROP INDEX IF EXISTS idx_user_activities_user_created_at;

-- Drop the user_activities table
DROP TABLE IF EXISTS public.user_activities CASCADE;

-- ============================================================================
-- PART 5: Recreate minimal job creator permissions without logging
-- ============================================================================

-- Create simplified function to grant job permissions to job creator (without user_activities logging)
CREATE OR REPLACE FUNCTION grant_job_creator_permissions()
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

-- Recreate the trigger for job creator permissions
CREATE TRIGGER grant_job_creator_permissions_trigger
    AFTER INSERT ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION grant_job_creator_permissions();

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION grant_job_creator_permissions() TO service_role;
GRANT EXECUTE ON FUNCTION grant_job_creator_permissions() TO postgres;

-- ============================================================================
-- PART 6: Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION grant_job_creator_permissions() IS 'Grants admin permissions to job creator and creates notifications for all company users (replaces user_activities logging)';

-- Note: All activity logging now uses the notifications table instead of user_activities
-- This provides a cleaner, more user-focused approach to tracking important events 