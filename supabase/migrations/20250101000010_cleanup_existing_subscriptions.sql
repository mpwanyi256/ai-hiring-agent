-- Clean up existing subscriptions and start fresh
-- This migration removes all existing subscription data to ensure proper Stripe integration

-- Delete all existing user subscriptions
DELETE FROM public.user_subscriptions;

-- Reset the sequence for the id column (if it exists)
ALTER SEQUENCE IF EXISTS public.user_subscriptions_id_seq RESTART WITH 1;

-- Verify cleanup
DO $$
DECLARE
    subscription_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subscription_count FROM public.user_subscriptions;
    
    IF subscription_count = 0 THEN
        RAISE NOTICE '✅ All existing subscriptions cleaned up successfully';
        RAISE NOTICE 'Database is now ready for fresh Stripe-integrated subscriptions';
    ELSE
        RAISE EXCEPTION '❌ Failed to clean up subscriptions. Count: %', subscription_count;
    END IF;
END $$; 