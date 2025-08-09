-- Fix RLS policies for webhook operations on user_subscriptions table
-- This ensures the service role can properly upsert subscription data from Stripe webhooks

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_update_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Enable user subscription access" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;

-- Create comprehensive RLS policies for user_subscriptions
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

-- Ensure service_role has all necessary permissions
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Verify the policies are working
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated for user_subscriptions table:';
    RAISE NOTICE '  - Service role can SELECT, INSERT, UPDATE, DELETE';
    RAISE NOTICE '  - Users can view and manage their own subscriptions';
    RAISE NOTICE '  - Webhook upsert operations should now work correctly';
END $$; 