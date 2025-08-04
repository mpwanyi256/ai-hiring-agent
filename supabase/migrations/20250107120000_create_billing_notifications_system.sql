-- Migration: Create billing notifications system
-- Description: Create billing notification preferences table and triggers for billing event notifications

-- Create billing notification preferences table
CREATE TABLE IF NOT EXISTS billing_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_receipts BOOLEAN DEFAULT true,
    email_reminders BOOLEAN DEFAULT true,
    email_failures BOOLEAN DEFAULT true,
    email_cancellations BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to ensure one preference record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_notification_preferences_user_id 
    ON billing_notification_preferences(user_id);

-- Enable RLS
ALTER TABLE billing_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own billing notification preferences" ON billing_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing notification preferences" ON billing_notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_billing_notification_preferences_updated_at 
    BEFORE UPDATE ON billing_notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create billing notifications
CREATE OR REPLACE FUNCTION create_billing_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_action_url VARCHAR(500) DEFAULT NULL,
    p_action_text VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    user_company_id UUID;
BEGIN
    -- Get user's company_id from profiles
    SELECT company_id INTO user_company_id 
    FROM profiles 
    WHERE id = p_user_id;
    
    IF user_company_id IS NULL THEN
        RAISE EXCEPTION 'User company not found for user_id: %', p_user_id;
    END IF;
    
    -- Insert notification
    INSERT INTO notifications (
        user_id,
        company_id,
        type,
        category,
        title,
        message,
        metadata,
        action_url,
        action_text,
        created_at
    ) VALUES (
        p_user_id,
        user_company_id,
        p_type,
        'billing',
        p_title,
        p_message,
        p_metadata,
        p_action_url,
        p_action_text,
        NOW()
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle subscription notifications
CREATE OR REPLACE FUNCTION handle_subscription_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title VARCHAR(255);
    notification_message TEXT;
    notification_type VARCHAR(50);
    notification_metadata JSONB;
    action_url VARCHAR(500);
    action_text VARCHAR(100);
BEGIN
    -- Determine notification details based on status change
    IF TG_OP = 'INSERT' THEN
        -- New subscription created
        notification_type := 'success';
        notification_title := 'Subscription Activated';
        notification_message := 'Your subscription has been successfully activated. Welcome aboard!';
        notification_metadata := jsonb_build_object(
            'subscription_id', NEW.stripe_subscription_id,
            'status', NEW.status,
            'event_type', 'subscription_created'
        );
        action_url := '/billing';
        action_text := 'View Billing';
        
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        -- Status changed
        CASE NEW.status
            WHEN 'active' THEN
                notification_type := 'success';
                notification_title := 'Payment Successful';
                notification_message := 'Your payment has been processed successfully. Your subscription is now active.';
                action_url := '/billing';
                action_text := 'View Receipt';
                
            WHEN 'past_due' THEN
                notification_type := 'warning';
                notification_title := 'Payment Failed';
                notification_message := 'We were unable to process your payment. Please update your payment method to avoid service interruption.';
                action_url := '/billing';
                action_text := 'Update Payment';
                
            WHEN 'canceled' THEN
                notification_type := 'info';
                notification_title := 'Subscription Cancelled';
                notification_message := 'Your subscription has been cancelled. You will continue to have access until your current billing period ends.';
                action_url := '/billing';
                action_text := 'Reactivate';
                
            WHEN 'unpaid' THEN
                notification_type := 'error';
                notification_title := 'Subscription Suspended';
                notification_message := 'Your subscription has been suspended due to failed payments. Please update your payment method immediately.';
                action_url := '/billing';
                action_text := 'Pay Now';
                
            WHEN 'trialing' THEN
                notification_type := 'info';
                notification_title := 'Trial Started';
                notification_message := 'Your free trial has started. Enjoy exploring all our features!';
                action_url := '/billing';
                action_text := 'View Trial';
                
            ELSE
                -- Default case for other statuses
                notification_type := 'info';
                notification_title := 'Subscription Updated';
                notification_message := format('Your subscription status has been updated to: %s', NEW.status);
                action_url := '/billing';
                action_text := 'View Details';
        END CASE;
        
        notification_metadata := jsonb_build_object(
            'subscription_id', NEW.stripe_subscription_id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'event_type', 'subscription_updated'
        );
    ELSE
        -- No notification needed
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Create the notification
    PERFORM create_billing_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        notification_type,
        notification_title,
        notification_message,
        notification_metadata,
        action_url,
        action_text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription notifications
DROP TRIGGER IF EXISTS user_subscription_notification_trigger ON user_subscriptions;
CREATE TRIGGER user_subscription_notification_trigger
    AFTER INSERT OR UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_notification();

-- Function to handle trial ending notifications
CREATE OR REPLACE FUNCTION check_trials_ending_soon()
RETURNS void AS $$
DECLARE
    sub_record RECORD;
    days_remaining INTEGER;
BEGIN
    -- Find trials ending in 3 days or less
    FOR sub_record IN 
        SELECT us.*, p.company_id
        FROM user_subscriptions us
        JOIN profiles p ON p.id = us.user_id
        WHERE us.status = 'trialing'
        AND us.trial_end IS NOT NULL
        AND us.trial_end <= NOW() + INTERVAL '3 days'
        AND us.trial_end > NOW()
    LOOP
        days_remaining := EXTRACT(DAYS FROM (sub_record.trial_end - NOW()));
        
        -- Create trial ending notification
        PERFORM create_billing_notification(
            sub_record.user_id,
            'warning',
            format('Trial Ending in %s Day%s', days_remaining, CASE WHEN days_remaining = 1 THEN '' ELSE 's' END),
            format('Your free trial will end in %s day%s. Choose a plan to continue enjoying our services.', 
                   days_remaining, CASE WHEN days_remaining = 1 THEN '' ELSE 's' END),
            jsonb_build_object(
                'subscription_id', sub_record.stripe_subscription_id,
                'trial_end', sub_record.trial_end,
                'days_remaining', days_remaining,
                'event_type', 'trial_ending'
            ),
            '/pricing',
            'Choose Plan'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE billing_notification_preferences IS 'User preferences for billing-related email notifications';
COMMENT ON FUNCTION create_billing_notification IS 'Creates a billing notification for a user';
COMMENT ON FUNCTION handle_subscription_notification IS 'Trigger function to create notifications when subscriptions change';
COMMENT ON FUNCTION check_trials_ending_soon IS 'Function to check for trials ending soon and create notifications';

-- Create default billing notification preferences for existing users
INSERT INTO billing_notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM billing_notification_preferences)
ON CONFLICT (user_id) DO NOTHING; 