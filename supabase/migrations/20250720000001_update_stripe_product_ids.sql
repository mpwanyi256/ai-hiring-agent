-- Update Stripe product IDs with the correct values
UPDATE public.subscriptions 
SET stripe_product_id = 'prod_Si0E1wtFVpHVeQ'
WHERE name = 'starter';

UPDATE public.subscriptions 
SET stripe_product_id = 'prod_Si0F0vvSAjGypZ'
WHERE name = 'professional';

UPDATE public.subscriptions 
SET stripe_product_id = 'prod_Si0Gk2H6wBM7pp'
WHERE name = 'enterprise';

-- Also update any other plans that might exist
UPDATE public.subscriptions 
SET stripe_product_id = 'prod_free_placeholder'
WHERE name = 'free';

UPDATE public.subscriptions 
SET stripe_product_id = 'prod_business_placeholder'
WHERE name = 'business'; 