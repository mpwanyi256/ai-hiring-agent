-- Allow authenticated company members to insert/select contract offers tied to their company

-- INSERT: company member can create an offer if the related contract belongs to their company
DROP POLICY IF EXISTS "Company members can insert contract offers" ON public.contract_offers;
CREATE POLICY "Company members can insert contract offers"
ON public.contract_offers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.contracts c
    JOIN public.profiles p ON p.company_id = c.company_id
    WHERE c.id = contract_offers.contract_id
      AND p.id = auth.uid()
  )
);

-- SELECT: company member can view offers for contracts in their company (needed for RETURNING)
DROP POLICY IF EXISTS "Company members can view contract offers" ON public.contract_offers;
CREATE POLICY "Company members can view contract offers"
ON public.contract_offers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contracts c
    JOIN public.profiles p ON p.company_id = c.company_id
    WHERE c.id = contract_offers.contract_id
      AND p.id = auth.uid()
  )
); 