-- Migration: Create notifications and activity tracking system
-- This migration creates tables and triggers for tracking user activities and notifications

-- Create user_activities table to track all user actions
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'candidate_status_change', 'contract_sent', 'interview_scheduled', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'candidate', 'contract', 'interview', etc.
    entity_id UUID NOT NULL, -- ID of the related entity
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add company_id column if it doesn't exist (for existing user_activities table)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'company_id') THEN
        ALTER TABLE user_activities ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add activity_type column if it doesn't exist (rename from event_type)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'activity_type') THEN
        -- If event_type exists, rename it to activity_type
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'event_type') THEN
            ALTER TABLE user_activities RENAME COLUMN event_type TO activity_type;
        ELSE
            ALTER TABLE user_activities ADD COLUMN activity_type VARCHAR(50) NOT NULL DEFAULT 'unknown';
        END IF;
    END IF;
END $$;

-- Add title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'title') THEN
        ALTER TABLE user_activities ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Activity';
    END IF;
END $$;

-- Add description column if it doesn't exist (rename from message)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'description') THEN
        -- If message exists, rename it to description
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'message') THEN
            ALTER TABLE user_activities RENAME COLUMN message TO description;
        ELSE
            ALTER TABLE user_activities ADD COLUMN description TEXT;
        END IF;
    END IF;
END $$;

-- Rename meta to metadata if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'metadata') THEN
        -- If meta exists, rename it to metadata
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'meta') THEN
            ALTER TABLE user_activities RENAME COLUMN meta TO metadata;
        ELSE
            ALTER TABLE user_activities ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_activities' AND column_name = 'updated_at') THEN
        ALTER TABLE user_activities ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error'
    category VARCHAR(50) NOT NULL, -- 'candidate', 'contract', 'interview', 'system', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500), -- Optional URL for action button
    action_text VARCHAR(100), -- Optional text for action button
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration for temporary notifications
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_company_id ON user_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_entity ON user_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create updated_at trigger for user_activities
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_activities_updated_at 
    BEFORE UPDATE ON user_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create activity and notification
CREATE OR REPLACE FUNCTION create_activity_and_notification(
    p_user_id UUID,
    p_company_id UUID,
    p_activity_type VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_title VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_activity_metadata JSONB DEFAULT '{}',
    p_notification_type VARCHAR DEFAULT 'info',
    p_notification_category VARCHAR DEFAULT NULL,
    p_notification_message TEXT DEFAULT NULL,
    p_action_url VARCHAR DEFAULT NULL,
    p_action_text VARCHAR DEFAULT NULL,
    p_notification_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    notification_id UUID;
BEGIN
    -- Create activity record
    INSERT INTO user_activities (
        user_id, company_id, activity_type, entity_type, entity_id,
        title, description, metadata
    ) VALUES (
        p_user_id, p_company_id, p_activity_type, p_entity_type, p_entity_id,
        p_title, p_description, p_activity_metadata
    ) RETURNING id INTO activity_id;

    -- Create notification if message provided
    IF p_notification_message IS NOT NULL THEN
        INSERT INTO notifications (
            user_id, company_id, type, category, title, message,
            action_url, action_text, metadata
        ) VALUES (
            p_user_id, p_company_id, p_notification_type, 
            COALESCE(p_notification_category, p_entity_type),
            p_title, p_notification_message,
            p_action_url, p_action_text, p_notification_metadata
        ) RETURNING id INTO notification_id;
    END IF;

    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for candidate status changes
CREATE OR REPLACE FUNCTION track_candidate_status_change()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    status_display VARCHAR;
BEGIN
    -- Get user profile information
    SELECT p.*, c.name as company_name 
    INTO user_profile
    FROM profiles p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = NEW.updated_by;

    -- Skip if no user profile found
    IF user_profile IS NULL THEN
        RETURN NEW;
    END IF;

    -- Format status for display
    status_display := CASE NEW.status
        WHEN 'applied' THEN 'Applied'
        WHEN 'screening' THEN 'In Screening'
        WHEN 'interviewing' THEN 'Interviewing'
        WHEN 'shortlisted' THEN 'Shortlisted'
        WHEN 'reference_check' THEN 'Reference Check'
        WHEN 'offer_extended' THEN 'Offer Extended'
        WHEN 'hired' THEN 'Hired'
        WHEN 'rejected' THEN 'Rejected'
        WHEN 'withdrawn' THEN 'Withdrawn'
        ELSE INITCAP(NEW.status)
    END;

    -- Create activity and notification for status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM create_activity_and_notification(
            p_user_id := NEW.updated_by,
            p_company_id := user_profile.company_id,
            p_activity_type := 'candidate_status_change',
            p_entity_type := 'candidate',
            p_entity_id := NEW.id,
            p_title := 'Candidate Status Updated',
            p_description := format('Status changed from %s to %s for %s %s', 
                COALESCE(INITCAP(OLD.status), 'New'), status_display, NEW.first_name, NEW.last_name),
            p_activity_metadata := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'candidate_name', NEW.first_name || ' ' || NEW.last_name,
                'job_id', NEW.job_id
            ),
            p_notification_type := CASE 
                WHEN NEW.status IN ('hired', 'offer_extended') THEN 'success'
                WHEN NEW.status IN ('rejected', 'withdrawn') THEN 'warning'
                ELSE 'info'
            END,
            p_notification_category := 'candidate',
            p_notification_message := format('%s %s status updated to %s', 
                NEW.first_name, NEW.last_name, status_display),
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', NEW.job_id, NEW.id),
            p_action_text := 'View Candidate'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for contract offer events
CREATE OR REPLACE FUNCTION track_contract_offer_events()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    candidate_info RECORD;
    contract_info RECORD;
    status_display VARCHAR;
    activity_title VARCHAR;
    activity_desc VARCHAR;
    notification_msg VARCHAR;
BEGIN
    -- Get related information
    SELECT p.*, c.name as company_name 
    INTO user_profile
    FROM profiles p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = COALESCE(NEW.sent_by, NEW.updated_by);

    SELECT first_name, last_name, job_id
    INTO candidate_info
    FROM candidates
    WHERE id = NEW.candidate_id;

    SELECT title
    INTO contract_info
    FROM contracts
    WHERE id = NEW.contract_id;

    -- Skip if no required information found
    IF user_profile IS NULL OR candidate_info IS NULL THEN
        RETURN NEW;
    END IF;

    -- Format status for display
    status_display := CASE NEW.status
        WHEN 'sent' THEN 'Sent'
        WHEN 'viewed' THEN 'Viewed'
        WHEN 'signed' THEN 'Signed'
        WHEN 'rejected' THEN 'Rejected'
        WHEN 'expired' THEN 'Expired'
        ELSE INITCAP(NEW.status)
    END;

    -- Handle new contract offers
    IF TG_OP = 'INSERT' THEN
        activity_title := 'Contract Offer Sent';
        activity_desc := format('Contract offer sent to %s %s for position: %s', 
            candidate_info.first_name, candidate_info.last_name, 
            COALESCE(contract_info.title, 'Unknown Position'));
        notification_msg := format('Contract offer sent to %s %s', 
            candidate_info.first_name, candidate_info.last_name);

        PERFORM create_activity_and_notification(
            p_user_id := NEW.sent_by,
            p_company_id := user_profile.company_id,
            p_activity_type := 'contract_sent',
            p_entity_type := 'contract_offer',
            p_entity_id := NEW.id,
            p_title := activity_title,
            p_description := activity_desc,
            p_activity_metadata := jsonb_build_object(
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'contract_id', NEW.contract_id,
                'contract_title', contract_info.title,
                'salary_amount', NEW.salary_amount,
                'salary_currency', NEW.salary_currency,
                'job_id', candidate_info.job_id
            ),
            p_notification_type := 'info',
            p_notification_category := 'contract',
            p_notification_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', candidate_info.job_id, NEW.candidate_id),
            p_action_text := 'View Details'
        );
    END IF;

    -- Handle status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        activity_title := format('Contract %s', status_display);
        activity_desc := format('Contract offer %s by %s %s', 
            LOWER(status_display), candidate_info.first_name, candidate_info.last_name);
        notification_msg := format('%s %s %s the contract offer', 
            candidate_info.first_name, candidate_info.last_name, LOWER(status_display));

        PERFORM create_activity_and_notification(
            p_user_id := COALESCE(NEW.updated_by, NEW.sent_by),
            p_company_id := user_profile.company_id,
            p_activity_type := format('contract_%s', NEW.status),
            p_entity_type := 'contract_offer',
            p_entity_id := NEW.id,
            p_title := activity_title,
            p_description := activity_desc,
            p_activity_metadata := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'candidate_id', NEW.candidate_id,
                'candidate_name', candidate_info.first_name || ' ' || candidate_info.last_name,
                'contract_id', NEW.contract_id,
                'contract_title', contract_info.title,
                'job_id', candidate_info.job_id
            ),
            p_notification_type := CASE 
                WHEN NEW.status = 'signed' THEN 'success'
                WHEN NEW.status IN ('rejected', 'expired') THEN 'warning'
                ELSE 'info'
            END,
            p_notification_category := 'contract',
            p_notification_message := notification_msg,
            p_action_url := format('/dashboard/jobs/%s/candidates/%s', candidate_info.job_id, NEW.candidate_id),
            p_action_text := 'View Details'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_track_candidate_status ON candidates;
CREATE TRIGGER trigger_track_candidate_status
    AFTER UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION track_candidate_status_change();

DROP TRIGGER IF EXISTS trigger_track_contract_offers ON contract_offers;
CREATE TRIGGER trigger_track_contract_offers
    AFTER INSERT OR UPDATE ON contract_offers
    FOR EACH ROW
    EXECUTE FUNCTION track_contract_offer_events();

-- RLS Policies
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User activities policies
CREATE POLICY "Users can view their company's activities"
    ON user_activities FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert activities for their company"
    ON user_activities FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications for users"
    ON notifications FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = ANY(notification_ids) 
    AND user_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = auth.uid()
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_activities TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO authenticated;
