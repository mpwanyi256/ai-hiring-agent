-- Check what pg_net functions are actually available
-- First, let's see what extensions are available and what functions exist

-- Create a function to list available extensions and functions
CREATE OR REPLACE FUNCTION check_available_extensions()
RETURNS TABLE(extension_name TEXT, function_name TEXT, function_signature TEXT) AS $$
BEGIN
  -- Check for pg_net extension
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RETURN QUERY
    SELECT 
      'pg_net'::TEXT,
      p.proname::TEXT,
      pg_get_function_identity_arguments(p.oid)::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions'
      AND p.proname LIKE '%http%';
  ELSE
    RETURN QUERY SELECT 'pg_net not found'::TEXT, ''::TEXT, ''::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler test function that doesn't rely on specific function names
CREATE OR REPLACE FUNCTION test_pgnet_simple()
RETURNS TEXT AS $$
DECLARE
  extension_exists BOOLEAN;
  functions_count INTEGER;
BEGIN
  -- Check if pg_net extension exists
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) INTO extension_exists;
  
  IF NOT extension_exists THEN
    RETURN 'pg_net extension is not installed';
  END IF;
  
  -- Count HTTP-related functions in extensions schema
  SELECT COUNT(*)
  INTO functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'extensions'
    AND p.proname LIKE '%http%';
  
  RETURN 'pg_net extension exists. Found ' || functions_count || ' HTTP-related functions in extensions schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_available_extensions() TO postgres;
GRANT EXECUTE ON FUNCTION test_pgnet_simple() TO postgres;

-- Add helpful comments
COMMENT ON FUNCTION check_available_extensions IS 'Lists available HTTP functions in pg_net extension';
COMMENT ON FUNCTION test_pgnet_simple IS 'Simple test to check if pg_net extension is available'; 