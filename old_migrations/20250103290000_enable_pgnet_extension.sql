-- Enable pg_net extension properly in Supabase
-- This extension allows PostgreSQL to make HTTP requests

-- First, ensure the extension is created in the extensions schema
CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA "extensions";

-- Grant usage on the extensions schema to the postgres user
GRANT USAGE ON SCHEMA extensions TO postgres;

-- Grant execute permission on all functions in the extensions schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres;

-- Create a test function to verify pg_net is working
CREATE OR REPLACE FUNCTION test_pgnet_connection()
RETURNS TEXT AS $$
DECLARE
  request_id BIGINT;
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Try a simple HTTP GET request to a test endpoint
  SELECT extensions.http_get('https://httpbin.org/get') INTO request_id;
  
  -- Get the response
  SELECT 
    status,
    content
  INTO 
    response_status,
    response_body
  FROM extensions.http_get_result(request_id);
  
  -- Return success if we get a 200 response
  IF response_status = 200 THEN
    RETURN 'pg_net is working correctly. Test request returned status: ' || response_status;
  ELSE
    RETURN 'pg_net is enabled but test request failed with status: ' || response_status;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'pg_net error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION test_pgnet_connection() TO postgres;

-- Add helpful comments
COMMENT ON EXTENSION pg_net IS 'PostgreSQL extension for making HTTP requests';
COMMENT ON FUNCTION test_pgnet_connection IS 'Test function to verify pg_net extension is working correctly'; 