-- Create the candidate-files storage bucket
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
ON CONFLICT (id) DO NOTHING; -- Avoid conflicts if bucket already exists

-- Create RLS policies for the candidate-files bucket

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-files' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to candidate files (employers need to view them)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-files'
);

-- Allow users to delete their own files (optional, for cleanup)
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'candidate-files' AND
  auth.role() = 'authenticated'
); 