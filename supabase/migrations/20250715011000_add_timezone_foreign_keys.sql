-- Add timezone_id column to companies table with foreign key constraint
ALTER TABLE companies ADD COLUMN IF NOT EXISTS timezone_id UUID;
ALTER TABLE companies ADD CONSTRAINT fk_companies_timezone_id FOREIGN KEY (timezone_id) REFERENCES timezones(id);

-- Add foreign key constraint to interviews table
ALTER TABLE interviews ADD CONSTRAINT fk_interviews_timezone_id FOREIGN KEY (timezone_id) REFERENCES timezones(id);

-- Add NOT NULL constraint to interviews.timezone_id after foreign key is established
-- This allows existing records to be updated before making the column required
ALTER TABLE interviews ALTER COLUMN timezone_id SET NOT NULL;

-- Add comments
COMMENT ON COLUMN companies.timezone_id IS 'Reference to timezone (timezones.id)'; 