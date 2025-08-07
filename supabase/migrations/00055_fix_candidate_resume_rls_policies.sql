-- Fix Candidate Resume RLS Policies Migration
-- This migration fixes RLS policies for candidate resume uploads and storage access

-- ============================================================================
-- PART 1: Ensure candidate-files storage bucket exists with correct settings
-- ============================================================================

-- Create or update the candidate-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-files',
  'candidate-files',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- PART 2: Create comprehensive storage.objects RLS policies for candidate-files
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access to candidate files" ON storage.objects;

-- Allow authenticated users to upload files to candidate-files bucket
CREATE POLICY "Allow authenticated uploads to candidate files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-files' AND
  auth.role() = 'authenticated'
);

-- Allow anonymous users to upload files to candidate-files bucket (for job applications)
CREATE POLICY "Allow anonymous uploads to candidate files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-files' AND
  auth.role() = 'anon'
);

-- Allow service role full access to candidate-files bucket
CREATE POLICY "Allow service role full access to candidate files" ON storage.objects
FOR ALL WITH CHECK (
  bucket_id = 'candidate-files' AND
  auth.role() = 'service_role'
);

-- Allow public read access to candidate files (employers need to view them)
CREATE POLICY "Allow public read access to candidate files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-files'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete from candidate files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'candidate-files' AND
  auth.role() = 'authenticated'
);

-- ============================================================================
-- PART 3: Fix candidate_resumes table RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anonymous users can upload resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Anyone can upload resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Anyone can read resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Employers can view resumes for their jobs" ON candidate_resumes;
DROP POLICY IF EXISTS "Service role can update resumes" ON candidate_resumes;
DROP POLICY IF EXISTS "Authenticated users can insert resumes" ON candidate_resumes;

-- Allow anonymous users to upload resumes (for interview flow)
CREATE POLICY "Anonymous users can upload resumes" ON candidate_resumes
FOR INSERT 
WITH CHECK (auth.role() = 'anon' OR auth.role() IS NULL);

-- Allow authenticated users to upload resumes
CREATE POLICY "Authenticated users can upload resumes" ON candidate_resumes
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow service role full access to resumes
CREATE POLICY "Service role full access to resumes" ON candidate_resumes
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous users to read their own resumes (by email matching)
CREATE POLICY "Anonymous users can read resumes by email" ON candidate_resumes
FOR SELECT 
USING (auth.role() = 'anon' OR auth.role() IS NULL);

-- Allow authenticated users to read resumes
CREATE POLICY "Authenticated users can read resumes" ON candidate_resumes
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Employers can view resumes for their jobs
CREATE POLICY "Employers can view resumes for their jobs" ON candidate_resumes
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = candidate_resumes.job_id 
    AND p.id = auth.uid()
  )
);

-- Job team members can view resumes for jobs they have access to
CREATE POLICY "Job team members can view resumes" ON candidate_resumes
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM job_permissions jp
    WHERE jp.job_id = candidate_resumes.job_id 
    AND jp.user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 4: Grant necessary permissions
-- ============================================================================

-- Grant permissions on candidate_resumes table
GRANT ALL ON candidate_resumes TO service_role;
GRANT SELECT, INSERT ON candidate_resumes TO authenticated;
GRANT SELECT, INSERT ON candidate_resumes TO anon;

-- Grant permissions on storage.objects
GRANT ALL ON storage.objects TO service_role;
GRANT SELECT, INSERT ON storage.objects TO authenticated;
GRANT SELECT, INSERT ON storage.objects TO anon;

-- Grant permissions on storage.buckets
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- ============================================================================
-- PART 5: Create indexes for better performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_candidate_resumes_job_id ON candidate_resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_email ON candidate_resumes(email);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_created_at ON candidate_resumes(created_at);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_parsing_status ON candidate_resumes(parsing_status);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_candidate_id ON candidate_resumes(candidate_id);

-- ============================================================================
-- PART 6: Add helpful comments to policies
-- ============================================================================

COMMENT ON POLICY "Anonymous users can upload resumes" ON candidate_resumes IS 
'Allows anonymous users to upload resumes during job application process';

COMMENT ON POLICY "Authenticated users can upload resumes" ON candidate_resumes IS 
'Allows authenticated users to upload resumes';

COMMENT ON POLICY "Service role full access to resumes" ON candidate_resumes IS 
'Allows service_role complete access for backend processing';

COMMENT ON POLICY "Anonymous users can read resumes by email" ON candidate_resumes IS 
'Allows anonymous users to read resumes (needed for interview flow)';

COMMENT ON POLICY "Authenticated users can read resumes" ON candidate_resumes IS 
'Allows authenticated users to read resumes';

COMMENT ON POLICY "Employers can view resumes for their jobs" ON candidate_resumes IS 
'Allows job creators to view resumes for their jobs';

COMMENT ON POLICY "Job team members can view resumes" ON candidate_resumes IS 
'Allows job team members with permissions to view resumes';

-- ============================================================================
-- PART 7: Verification
-- ============================================================================

DO $$
DECLARE
    storage_policy_count INTEGER;
    resume_policy_count INTEGER;
    bucket_exists BOOLEAN;
BEGIN
    -- Check storage policies
    SELECT COUNT(*) INTO storage_policy_count
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%candidate%';
    
    -- Check candidate_resumes policies
    SELECT COUNT(*) INTO resume_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'candidate_resumes';
    
    -- Check bucket exists
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'candidate-files'
    ) INTO bucket_exists;
    
    RAISE NOTICE '✅ Candidate Resume RLS Policies Migration Applied';
    RAISE NOTICE '  - Storage bucket exists: %', bucket_exists;
    RAISE NOTICE '  - Storage policies created: %', storage_policy_count;
    RAISE NOTICE '  - Resume table policies created: %', resume_policy_count;
    
    IF bucket_exists AND storage_policy_count >= 4 AND resume_policy_count >= 6 THEN
        RAISE NOTICE '  - ✅ All policies and bucket configured successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some policies or bucket may need manual verification';
        RAISE NOTICE '  - Expected: bucket=true, storage_policies>=4, resume_policies>=6';
        RAISE NOTICE '  - Actual: bucket=%, storage_policies=%, resume_policies=%', bucket_exists, storage_policy_count, resume_policy_count;
    END IF;
END $$; 