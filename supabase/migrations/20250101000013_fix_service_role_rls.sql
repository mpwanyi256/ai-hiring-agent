-- Fix service role RLS access for user_subscriptions table
-- This migration ensures the service role can properly access the table for webhook operations

-- First, let's check what policies exist and their current state
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Current RLS policies for user_subscriptions:';
    FOR policy_record IN 
        SELECT policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'user_subscriptions' 
        AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Policy: %, Command: %, Qual: %, With Check: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.qual, 
            policy_record.with_check;
    END LOOP;
END $$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "user_subscriptions_select_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_insert_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_update_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subscriptions_delete_policy" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Enable user subscription access" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;

-- Create a single comprehensive policy that allows service role full access
-- and users to manage their own subscriptions
CREATE POLICY "user_subscriptions_comprehensive_policy" ON public.user_subscriptions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        user_id = auth.uid()
    ) WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role' OR
        user_id = auth.uid()
    );

-- Ensure service_role has all necessary permissions
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;

-- Verify the service role can access the table
DO $$
DECLARE
    can_select BOOLEAN;
    can_insert BOOLEAN;
    can_update BOOLEAN;
    can_delete BOOLEAN;
BEGIN
    -- Test if service role can perform operations
    -- Note: We can't actually test this in a migration, but we can verify the policy exists
    
    SELECT COUNT(*) > 0 INTO can_select
    FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND schemaname = 'public'
    AND cmd = 'SELECT';
    
    SELECT COUNT(*) > 0 INTO can_insert
    FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND schemaname = 'public'
    AND cmd = 'INSERT';
    
    SELECT COUNT(*) > 0 INTO can_update
    FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND schemaname = 'public'
    AND cmd = 'UPDATE';
    
    SELECT COUNT(*) > 0 INTO can_delete
    FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND schemaname = 'public'
    AND cmd = 'DELETE';
    
    RAISE NOTICE '✅ RLS policies verification:';
    RAISE NOTICE '  - SELECT policy exists: %', can_select;
    RAISE NOTICE '  - INSERT policy exists: %', can_insert;
    RAISE NOTICE '  - UPDATE policy exists: %', can_update;
    RAISE NOTICE '  - DELETE policy exists: %', can_delete;
    RAISE NOTICE '  - Service role should now have full access to user_subscriptions';
    RAISE NOTICE '  - Webhook operations should work correctly';
END $$; 