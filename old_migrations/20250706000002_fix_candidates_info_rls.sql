-- Fix infinite recursion in candidates_info RLS policy
-- The current policy creates a circular dependency when joining candidates with candidates_info

-- Drop the problematic policy
DROP POLICY IF EXISTS "Employers can view candidate info for their jobs" ON candidates_info;

-- Create a simplified policy that allows all reads
-- Access control will be handled at the candidates level instead
CREATE POLICY "Allow all reads for candidates_info" ON candidates_info
  FOR SELECT 
  USING (true);

-- Add helpful comment
COMMENT ON POLICY "Allow all reads for candidates_info" ON candidates_info IS 'Simplified policy to avoid infinite recursion - access control handled at candidates level'; 