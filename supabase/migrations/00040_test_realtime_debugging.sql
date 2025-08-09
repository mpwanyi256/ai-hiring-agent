-- Test Realtime Debugging Migration
-- This migration creates debugging tools to test realtime functionality

-- ============================================================================
-- PART 1: Create a simple test table for realtime debugging
-- ============================================================================

-- Create a simple test table
CREATE TABLE IF NOT EXISTS public.realtime_test (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.realtime_test ENABLE ROW LEVEL SECURITY;

-- Add simple policies
CREATE POLICY "Anyone can view test messages" ON public.realtime_test
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can insert test messages" ON public.realtime_test
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.realtime_test TO authenticated;
GRANT ALL ON public.realtime_test TO anon;
GRANT ALL ON public.realtime_test TO service_role;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_test;

-- ============================================================================
-- PART 2: Create debugging functions
-- ============================================================================

-- Function to insert a test message
CREATE OR REPLACE FUNCTION public.insert_test_message(p_message TEXT DEFAULT 'Test message')
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.realtime_test (message)
  VALUES (p_message)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_test_message(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_test_message(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_test_message(TEXT) TO service_role;

-- Function to check realtime configuration
CREATE OR REPLACE FUNCTION public.check_realtime_config()
RETURNS TABLE (
  table_name TEXT,
  in_publication BOOLEAN,
  replica_identity CHAR,
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
    c.relreplident as replica_identity,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO anon;
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO service_role;

-- ============================================================================
-- PART 3: Check and fix any potential issues
-- ============================================================================

-- Ensure all message tables have proper permissions for realtime
GRANT SELECT ON public.messages TO postgres;
GRANT SELECT ON public.message_reactions TO postgres;
GRANT SELECT ON public.message_read_status TO postgres;

-- Ensure supabase_realtime role has access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime_replicator') THEN
    GRANT SELECT ON public.messages TO supabase_realtime_replicator;
    GRANT SELECT ON public.message_reactions TO supabase_realtime_replicator;
    GRANT SELECT ON public.message_read_status TO supabase_realtime_replicator;
    GRANT SELECT ON public.realtime_test TO supabase_realtime_replicator;
  END IF;
END $$;

-- ============================================================================
-- PART 4: Simplified verification without the problematic loop
-- ============================================================================

DO $$
DECLARE
    test_id UUID;
BEGIN
    RAISE NOTICE '=== Realtime Configuration Check ===';
    
    -- Insert a test message
    test_id := public.insert_test_message('Realtime test message at ' || NOW()::TEXT);
    RAISE NOTICE 'Test message inserted with ID: %', test_id;
    
    RAISE NOTICE '✅ Realtime debugging setup complete';
    RAISE NOTICE 'Use SELECT * FROM check_realtime_config() to check configuration';
    RAISE NOTICE 'Use SELECT insert_test_message(''your message'') to test realtime';
    RAISE NOTICE 'Monitor public.realtime_test table for realtime updates';
END $$; 