-- active_contract_placeholders
ALTER VIEW public.active_contract_placeholders SET (security_invoker = on);
GRANT SELECT ON public.active_contract_placeholders TO authenticated;

-- contract_offer_details
ALTER VIEW public.contract_offer_details SET (security_invoker = on);
GRANT SELECT ON public.contract_offer_details TO authenticated;

-- contract_offers_comprehensive
ALTER VIEW public.contract_offers_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.contract_offers_comprehensive TO authenticated;

-- contracts_view
ALTER VIEW public.contracts_view SET (security_invoker = on);
GRANT SELECT ON public.contracts_view TO authenticated;

-- google_token_status
ALTER VIEW public.google_token_status SET (security_invoker = on);
GRANT SELECT ON public.google_token_status TO authenticated;
GRANT SELECT ON public.google_token_status TO service_role;
