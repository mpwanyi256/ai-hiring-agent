-- Migration: Fix function_logs status check constraint
-- This migration updates the status check constraint to allow all used status values

ALTER TABLE function_logs DROP CONSTRAINT IF EXISTS function_logs_status_check;
ALTER TABLE function_logs ADD CONSTRAINT function_logs_status_check CHECK (
  status IN ('pending', 'success', 'failed', 'called', 'triggered', 'ready_for_processing', 'skipped')
);

-- Add helpful comment
COMMENT ON CONSTRAINT function_logs_status_check ON function_logs IS 'Ensures status is one of the allowed values used by triggers and logging.'; 