-- Fix storage policies for signed-contracts bucket to allow anonymous uploads during contract signing

-- Drop existing policies for signed-contracts bucket
DROP POLICY IF EXISTS "Authenticated users can upload signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can view signed contracts" ON storage.objects;

-- Create new policies that allow anonymous users to upload signed contracts
-- This is necessary for the contract signing workflow where candidates (anonymous users) need to upload signed PDFs

-- Allow anonymous users to upload signed contracts (for contract signing process)
CREATE POLICY "Anonymous users can upload signed contracts" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'signed-contracts');

-- Allow authenticated users to upload signed contracts (for admin/company operations)
CREATE POLICY "Authenticated users can upload signed contracts" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts');

-- Allow authenticated users to view signed contracts from their company
CREATE POLICY "Authenticated users can view signed contracts" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'signed-contracts');

-- Allow anonymous users to view signed contracts (for contract signing and download)
CREATE POLICY "Anonymous users can view signed contracts" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'signed-contracts');

-- Allow authenticated users to update signed contracts (for admin operations)
CREATE POLICY "Authenticated users can update signed contracts" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signed-contracts');

-- Allow authenticated users to delete signed contracts (for admin operations)
CREATE POLICY "Authenticated users can delete signed contracts" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'signed-contracts');
