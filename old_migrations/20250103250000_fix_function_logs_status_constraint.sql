-- Fix the status check constraint on function_logs table to include 'processing'
-- First, drop the existing constraint
ALTER TABLE function_logs DROP CONSTRAINT IF EXISTS function_logs_status_check;

-- Add the updated constraint with all valid status values
ALTER TABLE function_logs ADD CONSTRAINT function_logs_status_check 
CHECK (status IN ('pending', 'processing', 'success', 'failed'));

-- Add helpful comment
COMMENT ON CONSTRAINT function_logs_status_check ON function_logs IS 'Validates status values for function_logs table'; 