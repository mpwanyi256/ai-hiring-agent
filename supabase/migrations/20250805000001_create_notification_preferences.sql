-- Migration: Create notification preferences table
-- Description: Create a table to store user notification preferences

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Email notifications
    email_enabled BOOLEAN DEFAULT true,
    email_job_applications BOOLEAN DEFAULT true,
    email_interview_scheduled BOOLEAN DEFAULT true,
    email_interview_reminders BOOLEAN DEFAULT true,
    email_candidate_updates BOOLEAN DEFAULT true,
    email_system_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    
    -- Push notifications (for future use)
    push_enabled BOOLEAN DEFAULT true,
    push_job_applications BOOLEAN DEFAULT true,
    push_interview_scheduled BOOLEAN DEFAULT true,
    push_interview_reminders BOOLEAN DEFAULT true,
    push_candidate_updates BOOLEAN DEFAULT true,
    
    -- In-app notifications
    in_app_enabled BOOLEAN DEFAULT true,
    in_app_job_applications BOOLEAN DEFAULT true,
    in_app_interview_scheduled BOOLEAN DEFAULT true,
    in_app_candidate_updates BOOLEAN DEFAULT true,
    in_app_system_updates BOOLEAN DEFAULT true,
    
    -- Notification timing preferences
    email_digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_digest_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone_id UUID REFERENCES public.timezones(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to ensure one preference record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
    ON public.notification_preferences(user_id);

-- Create index on company_id for efficient company-wide queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_company_id 
    ON public.notification_preferences(company_id);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        user_id IN (
            SELECT id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Create function to automatically create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (
        user_id,
        company_id,
        email_enabled,
        email_job_applications,
        email_interview_scheduled,
        email_interview_reminders,
        email_candidate_updates,
        email_system_updates,
        email_marketing,
        push_enabled,
        push_job_applications,
        push_interview_scheduled,
        push_interview_reminders,
        push_candidate_updates,
        in_app_enabled,
        in_app_job_applications,
        in_app_interview_scheduled,
        in_app_candidate_updates,
        in_app_system_updates
    ) VALUES (
        NEW.id,
        NEW.company_id,
        true,  -- email_enabled
        true,  -- email_job_applications
        true,  -- email_interview_scheduled
        true,  -- email_interview_reminders
        true,  -- email_candidate_updates
        true,  -- email_system_updates
        false, -- email_marketing
        true,  -- push_enabled
        true,  -- push_job_applications
        true,  -- push_interview_scheduled
        true,  -- push_interview_reminders
        true,  -- push_candidate_updates
        true,  -- in_app_enabled
        true,  -- in_app_job_applications
        true,  -- in_app_interview_scheduled
        true,  -- in_app_candidate_updates
        true   -- in_app_system_updates
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create notification preferences for new users
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON public.profiles;
CREATE TRIGGER trigger_create_notification_preferences
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_notification_preferences_timestamp ON public.notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_timestamp
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_notification_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_preferences_updated_at() TO authenticated; 