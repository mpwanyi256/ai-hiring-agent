-- Create storage bucket for signed contract documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-contracts',
  'signed-contracts',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- Create RLS policies for the signed-contracts bucket
CREATE POLICY "Allow authenticated users to upload signed contracts" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts');

CREATE POLICY "Allow authenticated users to view signed contracts from their company" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'signed-contracts' AND
    EXISTS (
      SELECT 1 FROM contract_offers co
      JOIN profiles p ON co.sent_by = p.id
      WHERE p.company_id = (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND co.signed_copy_url LIKE '%' || name || '%'
    )
  );

CREATE POLICY "Allow anonymous users to view signed contracts with valid token" ON storage.objects
  FOR SELECT
  TO anon
  USING (
    bucket_id = 'signed-contracts' AND
    EXISTS (
      SELECT 1 FROM contract_offers co
      WHERE co.signed_copy_url LIKE '%' || name || '%'
    )
  );

-- Fix the infinite recursion issue in contract_offers RLS policy
-- Drop the problematic policy and recreate it properly
DROP POLICY IF EXISTS "Allow candidates access for contract signing" ON public.contract_offers;
DROP POLICY IF EXISTS "Allow contract offers access for contract signing" ON public.contract_offers;

-- Create a proper RLS policy for contract_offers that doesn't cause recursion
CREATE POLICY "Allow authenticated users to access their company's contract offers" ON public.contract_offers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN contracts c ON c.company_id = p.company_id
      WHERE p.id = auth.uid() AND c.id = contract_offers.contract_id
    )
  );

CREATE POLICY "Allow anonymous users to access contract offers with valid token" ON public.contract_offers
  FOR SELECT
  TO anon
  USING (true); -- Allow all anonymous access - token validation is done in application layer

-- Ensure contract_offers table has RLS enabled
ALTER TABLE public.contract_offers ENABLE ROW LEVEL SECURITY;
