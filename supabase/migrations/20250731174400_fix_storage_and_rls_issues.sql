-- Fix storage bucket configuration
UPDATE storage.buckets 
SET public = false 
WHERE id = 'signed-contracts';

-- Drop all existing RLS policies on contract_offers to prevent conflicts
DROP POLICY IF EXISTS "Users can view contract offers for their company" ON public.contract_offers;
DROP POLICY IF EXISTS "Users can create contract offers for their company contracts" ON public.contract_offers;
DROP POLICY IF EXISTS "Users can update contract offers for their company" ON public.contract_offers;
DROP POLICY IF EXISTS "Allow authenticated users to access their company's contract of" ON public.contract_offers;
DROP POLICY IF EXISTS "Allow anonymous users to access contract offers with valid toke" ON public.contract_offers;
DROP POLICY IF EXISTS "Allow candidates access for contract signing" ON public.contract_offers;
DROP POLICY IF EXISTS "Allow contract offers access for contract signing" ON public.contract_offers;

-- Create clean, non-recursive RLS policies for contract_offers
CREATE POLICY "Authenticated users can manage their company contract offers" ON public.contract_offers
  FOR ALL
  TO authenticated
  USING (
    sent_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2, contracts c
      WHERE p1.id = auth.uid() 
      AND p2.id = contract_offers.sent_by
      AND p1.company_id = p2.company_id
      AND c.id = contract_offers.contract_id
      AND c.company_id = p1.company_id
    )
  );

CREATE POLICY "Anonymous users can view contract offers for signing" ON public.contract_offers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can update contract offers for signing" ON public.contract_offers
  FOR UPDATE
  TO anon
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.contract_offers ENABLE ROW LEVEL SECURITY;

-- Fix storage policies - drop existing ones and recreate properly
DROP POLICY IF EXISTS "Allow authenticated users to upload signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view signed contracts from their company" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous users to view signed contracts with valid token" ON storage.objects;

-- Create simplified storage policies
CREATE POLICY "Authenticated users can upload signed contracts" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can view signed contracts" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'signed-contracts');

CREATE POLICY "Anonymous users can view signed contracts" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'signed-contracts');
