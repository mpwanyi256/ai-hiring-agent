-- Update Stripe price IDs with the actual values
UPDATE public.subscriptions 
SET stripe_price_id = 'price_1RmaEEED2h3xLkqttvf6IBZB'
WHERE name = 'starter';

UPDATE public.subscriptions 
SET stripe_price_id = 'price_1RmaF2ED2h3xLkqtIVi6vwBQ'
WHERE name = 'professional';

UPDATE public.subscriptions 
SET stripe_price_id = 'price_1RmaFjED2h3xLkqtlPetXvuJ'
WHERE name = 'enterprise';

-- Also update any other plans that might exist
UPDATE public.subscriptions 
SET stripe_price_id = 'price_free_placeholder'
WHERE name = 'free';

UPDATE public.subscriptions 
SET stripe_price_id = 'price_business_placeholder'
WHERE name = 'business'; 