-- =====================================================
-- Row Level Security Policies for New Tables
-- =====================================================

-- Enable RLS on countries table
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Countries table policies
-- Countries are reference data that should be readable by all authenticated users
-- No one should be able to modify country data (it's static reference data)

-- Allow all authenticated users to read countries
CREATE POLICY "Allow authenticated users to read countries" ON countries
  FOR SELECT USING (true);

-- Deny all modifications to countries (reference data should not be modified)
CREATE POLICY "Deny all modifications to countries" ON countries
  FOR ALL USING (false);

-- Enable RLS on timezones table
ALTER TABLE timezones ENABLE ROW LEVEL SECURITY;

-- Timezones table policies
-- Timezones are reference data that should be readable by all authenticated users
-- No one should be able to modify timezone data (it's static reference data)

-- Allow all authenticated users to read timezones
CREATE POLICY "Allow authenticated users to read timezones" ON timezones
  FOR SELECT USING (auth.role() = 'authenticated');

-- Deny all modifications to timezones (reference data should not be modified)
CREATE POLICY "Deny all modifications to timezones" ON timezones
  FOR ALL USING (false);

-- =====================================================
-- Service Role Access for System Operations
-- =====================================================

-- Allow service role to read countries (for system operations)
CREATE POLICY "Allow service role to read countries" ON countries
  FOR SELECT USING (auth.role() = 'service_role');

-- Allow service role to read timezones (for system operations)
CREATE POLICY "Allow service role to read timezones" ON timezones
  FOR SELECT USING (auth.role() = 'service_role');

-- =====================================================
-- Anonymous Access for Public APIs (if needed)
-- =====================================================

-- Allow anonymous access to read countries (for public timezone selection)
-- This is useful for public interview scheduling where candidates need to select timezones
CREATE POLICY "Allow anonymous users to read countries" ON countries
  FOR SELECT USING (auth.role() = 'anon');

-- Allow anonymous access to read timezones (for public timezone selection)
-- This is useful for public interview scheduling where candidates need to select timezones
CREATE POLICY "Allow anonymous users to read timezones" ON timezones
  FOR SELECT USING (auth.role() = 'anon');

-- =====================================================
-- Additional Security Measures
-- =====================================================

-- Create a function to prevent modification of reference data
CREATE OR REPLACE FUNCTION prevent_reference_data_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Modification of reference data is not allowed';
END;
$$ LANGUAGE plpgsql;

-- Add triggers to prevent modification of countries and timezones
CREATE TRIGGER prevent_countries_modification
  BEFORE INSERT OR UPDATE OR DELETE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reference_data_modification();

CREATE TRIGGER prevent_timezones_modification
  BEFORE INSERT OR UPDATE OR DELETE ON timezones
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reference_data_modification();

-- =====================================================
-- Comments and Documentation
-- =====================================================

COMMENT ON TABLE countries IS 'Reference data table containing world countries. Read-only for all users.';
COMMENT ON TABLE timezones IS 'Reference data table containing world timezones. Read-only for all users.';

COMMENT ON POLICY "Allow authenticated users to read countries" ON countries IS 'Allows authenticated users to read country data for timezone selection and company settings.';
COMMENT ON POLICY "Allow authenticated users to read timezones" ON timezones IS 'Allows authenticated users to read timezone data for interview scheduling and company settings.';

COMMENT ON POLICY "Allow anonymous users to read countries" ON countries IS 'Allows anonymous users to read country data for public interview scheduling.';
COMMENT ON POLICY "Allow anonymous users to read timezones" ON timezones IS 'Allows anonymous users to read timezone data for public interview scheduling.';

COMMENT ON FUNCTION prevent_reference_data_modification() IS 'Prevents any modification of reference data tables (countries, timezones) to maintain data integrity.'; 