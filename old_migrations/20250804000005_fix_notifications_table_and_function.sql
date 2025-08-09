-- Migration: Fix notifications table structure and grant_job_creator_permissions function
-- This adds missing columns and fixes the function to work with the actual table structure

-- Add missing columns to notifications table if they don't exist
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON public.notifications(related_entity_type, related_entity_id);

-- Drop and recreate the function with the correct notifications table structure
DROP FUNCTION IF EXISTS grant_job_creator_permissions() CASCADE;

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

COMMENT ON FUNCTION grant_job_creator_permissions() IS 'Grants admin permissions to job creator and creates notifications for all company users'; 