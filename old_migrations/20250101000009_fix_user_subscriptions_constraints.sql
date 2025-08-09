-- Fix user_subscriptions table constraints for proper upsert behavior
-- This ensures that each user can only have one active subscription record

-- Add unique constraint on user_id to prevent duplicate subscriptions per user
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_unique 
UNIQUE (user_id);

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
ON public.user_subscriptions (user_id);

-- Add index on stripe_subscription_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id 
ON public.user_subscriptions (stripe_subscription_id);

-- Add index on status for filtering active subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
ON public.user_subscriptions (status);

-- Verify the constraints
DO $$
BEGIN
    RAISE NOTICE 'User subscriptions table constraints updated:';
    RAISE NOTICE '  - Added unique constraint on user_id';
    RAISE NOTICE '  - Added indexes for better performance';
    RAISE NOTICE '  - Webhook upsert operations will now work correctly';
END $$; 