-- Create storage bucket for candidate files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-files',
  'candidate-files',
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the candidate-files bucket
CREATE POLICY "Anyone can view candidate files" ON storage.objects
  FOR SELECT USING (bucket_id = 'candidate-files');

CREATE POLICY "Authenticated users can upload candidate files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'candidate-files');

CREATE POLICY "Users can update their own candidate files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'candidate-files');

CREATE POLICY "Users can delete their own candidate files" ON storage.objects
  FOR DELETE USING (bucket_id = 'candidate-files'); 