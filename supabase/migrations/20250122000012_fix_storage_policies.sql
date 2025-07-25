-- Update the bucket configuration to ensure it's properly set up
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json'
  ]
WHERE id = 'message-attachments'; 