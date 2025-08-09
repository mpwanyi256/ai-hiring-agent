-- Create service configuration table for storing sensitive configuration
CREATE TABLE IF NOT EXISTS service_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the service role key (this should be updated with the actual key)
INSERT INTO service_config (key_name, key_value, description, is_encrypted) 
VALUES (
  'supabase_service_role_key',
  'your-service-role-key-here', -- This needs to be updated with the actual key
  'Supabase service role key for Edge Function calls',
  true
) ON CONFLICT (key_name) DO NOTHING;

-- Enable RLS on service_config
ALTER TABLE service_config ENABLE ROW LEVEL SECURITY;

-- Only service_role can access service_config
CREATE POLICY "Service role can manage service config" ON service_config
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON service_config TO service_role;

-- Create function to get service role key
CREATE OR REPLACE FUNCTION get_service_role_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT;
BEGIN
  SELECT key_value INTO service_key
  FROM service_config
  WHERE key_name = 'supabase_service_role_key';
  
  RETURN service_key;
END;
$$;

-- Grant execute permission to authenticated users (needed for trigger function)
GRANT EXECUTE ON FUNCTION get_service_role_key() TO authenticated;

-- Add helpful comments
COMMENT ON TABLE service_config IS 'Stores sensitive configuration values like API keys';
COMMENT ON FUNCTION get_service_role_key IS 'Returns the Supabase service role key for Edge Function calls'; 