-- Script to update the service role key in the service_config table
-- Replace 'your-actual-service-role-key-here' with your real Supabase service role key

UPDATE service_config 
SET 
  key_value = 'your-actual-service-role-key-here',
  updated_at = NOW()
WHERE key_name = 'supabase_service_role_key';

-- Verify the update
SELECT key_name, description, is_encrypted, updated_at 
FROM service_config 
WHERE key_name = 'supabase_service_role_key'; 