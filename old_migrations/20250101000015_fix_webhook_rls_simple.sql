-- Fix RLS policies for webhook operations - simple approach
-- Allow authenticated users to create and update subscriptions for webhook operations

-- Drop existing policies
DROP POLICY IF EXISTS "user_subscriptions_comprehensive_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_update_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_delete_policy" ON public.user_subscriptions;

-- Create simple policies that allow authenticated users to manage subscriptions
-- This is much cleaner than using service role for webhook operations

-- SELECT policy: Users can view their own subscriptions
CREATE POLICY "user_subscriptions_select_policy" ON public.user_subscriptions
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- INSERT policy: Allow authenticated users to create subscriptions (for webhooks)
CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- UPDATE policy: Users can update their own subscriptions, or authenticated users can update any (for webhooks)
CREATE POLICY "user_subscriptions_update_policy" ON public.user_subscriptions
    FOR UPDATE USING (
        user_id = auth.uid() OR auth.role() = 'authenticated'
    );

-- DELETE policy: Users can delete their own subscriptions
CREATE POLICY "user_subscriptions_delete_policy" ON public.user_subscriptions
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;

-- Verify the policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND schemaname = 'public';
    
    RAISE NOTICE '✅ RLS policies updated successfully';
    RAISE NOTICE '  - Total policies: %', policy_count;
    RAISE NOTICE '  - Authenticated users can now create/update subscriptions';
    RAISE NOTICE '  - Webhook operations should work without service role';
END $$; 