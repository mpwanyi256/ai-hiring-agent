-- Add missing message column to function_logs table
-- This migration fixes the trigger errors where the message column is referenced but doesn't exist

-- Add the message column to function_logs table
ALTER TABLE function_logs 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add comment for the new column
COMMENT ON COLUMN function_logs.message IS 'Human-readable message describing the function log entry';

-- Update existing records to have a default message if they don't have one
UPDATE function_logs 
SET message = CASE 
  WHEN function_name = 'ai-candidate-evaluation' THEN 'AI evaluation triggered automatically'
  WHEN function_name = 'ai-candidate-evaluation-manual' THEN 'AI evaluation triggered manually'
  ELSE 'Function execution logged'
END
WHERE message IS NULL;

-- Make the message column NOT NULL for future records
ALTER TABLE function_logs 
ALTER COLUMN message SET NOT NULL;

-- Add index for message column for better query performance
CREATE INDEX IF NOT EXISTS idx_function_logs_message ON function_logs(message); 