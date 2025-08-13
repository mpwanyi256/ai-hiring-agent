-- Restore signed-contracts storage bucket policies to previous working state

-- Ensure bucket exists and is private (as per 20250731174400)
INSERT INTO storage.buckets (id, name, public)
SELECT 'signed-contracts', 'signed-contracts', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'signed-contracts');

UPDATE storage.buckets SET public = false WHERE id = 'signed-contracts';

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view signed contracts from their company" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous users to view signed contracts with valid token" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can view signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update signed contracts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete signed contracts" ON storage.objects;

-- Recreate policies from 20250731180500_fix_signed_contracts_storage_policies.sql
CREATE POLICY "Anonymous users can upload signed contracts" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can upload signed contracts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can view signed contracts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signed-contracts');

CREATE POLICY "Anonymous users can view signed contracts" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can update signed contracts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'signed-contracts');

CREATE POLICY "Authenticated users can delete signed contracts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'signed-contracts'); 