-- Fix Realtime Config Function Migration
-- This migration fixes the check_realtime_config function to handle replica_identity correctly

-- ============================================================================
-- PART 1: Drop and recreate the function with correct return type
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.check_realtime_config();

-- Create the function with corrected return type and proper casting
CREATE OR REPLACE FUNCTION public.check_realtime_config()
RETURNS TABLE (
  table_name TEXT,
  in_publication BOOLEAN,
  replica_identity TEXT,
  policy_count INTEGER,
  has_anon_select BOOLEAN,
  has_authenticated_select BOOLEAN,
  has_service_role_select BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    EXISTS (
      SELECT 1 FROM pg_publication_tables pt 
      WHERE pt.pubname = 'supabase_realtime' 
      AND pt.tablename = t.table_name
    ) as in_publication,
    CASE c.relreplident 
      WHEN 'd' THEN 'default'
      WHEN 'f' THEN 'full'
      WHEN 'i' THEN 'index'
      WHEN 'n' THEN 'nothing'
      ELSE 'unknown'
    END::TEXT as replica_identity,
    (
      SELECT COUNT(*)::INTEGER 
      FROM pg_policies p 
      WHERE p.tablename = t.table_name 
      AND p.schemaname = 'public'
    ) as policy_count,
    EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.table_name 
      AND p.schemaname = 'public'
      AND p.roles @> '{anon}'
    ) as has_anon_select,
    EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.table_name 
      AND p.schemaname = 'public'
      AND p.roles @> '{authenticated}'
    ) as has_authenticated_select,
    EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.tablename = t.table_name 
      AND p.schemaname = 'public'
      AND p.roles @> '{service_role}'
    ) as has_service_role_select
  FROM information_schema.tables t
  JOIN pg_class c ON c.relname = t.table_name
  WHERE t.table_schema = 'public' 
  AND t.table_name IN ('messages', 'message_reactions', 'message_read_status', 'realtime_test')
  GROUP BY t.table_name, c.relreplident;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO anon;
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO service_role;

-- ============================================================================
-- PART 3: Test the function
-- ============================================================================

DO $$
DECLARE
    config_record RECORD;
    function_works BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE '=== Testing Realtime Configuration Function ===';
    
    -- Test if the function works
    BEGIN
        FOR config_record IN SELECT * FROM public.check_realtime_config() LIMIT 1 LOOP
            EXIT; -- Just test if it executes without error
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        function_works := FALSE;
        RAISE NOTICE 'Function test failed: %', SQLERRM;
    END;
    
    IF function_works THEN
        RAISE NOTICE '✅ Realtime configuration function fixed successfully';
        RAISE NOTICE 'Use SELECT * FROM check_realtime_config() to check configuration';
    ELSE
        RAISE NOTICE '❌ Function still has issues';
    END IF;
END $$; 