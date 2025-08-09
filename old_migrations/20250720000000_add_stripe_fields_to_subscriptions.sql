-- Add Stripe-specific fields to existing subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS interval VARCHAR(20) DEFAULT 'month';

-- Add Stripe-specific fields to existing user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add index for stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);

-- Update existing subscription plans with Stripe product IDs (you'll need to replace these with actual price IDs for checkout)
UPDATE public.subscriptions 
SET stripe_product_id = 'prod_Si0E1wtFVpHVeQ', 
    stripe_price_id = 'price_starter_placeholder', -- Replace with actual price ID from Stripe
    trial_days = 30,
    interval = 'month'
WHERE name = 'starter';

UPDATE public.subscriptions 
SET stripe_product_id = 'prod_Si0F0vvSAjGypZ', 
    stripe_price_id = 'price_professional_placeholder', -- Replace with actual price ID from Stripe
    trial_days = 30,
    interval = 'month'
WHERE name = 'professional';

UPDATE public.subscriptions 
SET stripe_product_id = 'prod_enterprise_placeholder', 
    stripe_price_id = 'price_enterprise_placeholder', -- Replace with actual price ID from Stripe
    trial_days = 30,
    interval = 'month'
WHERE name = 'enterprise';

-- Also update any other plans that might exist
UPDATE public.subscriptions 
SET stripe_product_id = 'prod_free_placeholder', 
    stripe_price_id = 'price_free_placeholder', -- Replace with actual price ID from Stripe
    trial_days = 30,
    interval = 'month'
WHERE name = 'free';

UPDATE public.subscriptions 
SET stripe_product_id = 'prod_business_placeholder', 
    stripe_price_id = 'price_business_placeholder', -- Replace with actual price ID from Stripe
    trial_days = 30,
    interval = 'month'
WHERE name = 'business'; 