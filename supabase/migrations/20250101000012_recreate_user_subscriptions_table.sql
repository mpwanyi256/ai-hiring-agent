-- Recreate user_subscriptions table with proper RLS policies
-- This migration fixes the RLS policy issues that were blocking webhook operations

-- Drop existing table and all related objects
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- Recreate the user_subscriptions table with all necessary fields
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'paused', 'trialing', 'past_due', 'unpaid', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on user_id to ensure one subscription per user
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_unique 
UNIQUE (user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions (stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions (status);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions (stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (in case they exist)
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_update_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_delete_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Enable user subscription access" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;

-- Create comprehensive RLS policies that work with service role
-- SELECT policy: Users can view their own subscriptions, service role can view all
CREATE POLICY "user_subscriptions_select_policy" ON public.user_subscriptions
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- INSERT policy: Service role can insert, users can insert their own (for initial free tier)
CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR
        user_id = auth.uid()
    );

-- UPDATE policy: Service role can update any subscription, users can update their own
CREATE POLICY "user_subscriptions_update_policy" ON public.user_subscriptions
    FOR UPDATE USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- DELETE policy: Service role can delete, users can delete their own
CREATE POLICY "user_subscriptions_delete_policy" ON public.user_subscriptions
    FOR DELETE USING (
        user_id = auth.uid() OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Grant all necessary permissions to service_role
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;

-- Create trigger for updated_at column
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created correctly
DO $$
DECLARE
    table_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_subscriptions'
    ) INTO table_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND schemaname = 'public';
    
    IF table_exists THEN
        RAISE NOTICE '✅ user_subscriptions table created successfully';
        RAISE NOTICE '✅ % RLS policies created', policy_count;
        RAISE NOTICE '✅ Service role has full access to user_subscriptions table';
        RAISE NOTICE '✅ Webhook operations should now work correctly';
    ELSE
        RAISE EXCEPTION '❌ Failed to create user_subscriptions table';
    END IF;
END $$; 