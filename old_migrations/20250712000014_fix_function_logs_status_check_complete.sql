-- Migration: Fix function_logs status check constraint to include all trigger status values
-- This migration updates the status check constraint to allow all status values used by triggers and logging

-- Drop the existing constraint
ALTER TABLE function_logs DROP CONSTRAINT IF EXISTS function_logs_status_check;

-- Add the updated constraint with all possible status values
ALTER TABLE function_logs ADD CONSTRAINT function_logs_status_check CHECK (
  status IN (
    -- Original status values
    'pending', 
    'success', 
    'failed',
    
    -- Trigger function status values
    'called',
    'triggered',
    'ready_for_processing',
    'skipped',
    
    -- Edge function status values
    'triggering_edge_function',
    'edge_function_called',
    'edge_function_success',
    'edge_function_error',
    
    -- Error status values
    'error',
    
    -- Processing status values
    'processing'
  )
);

-- Add helpful comment
COMMENT ON CONSTRAINT function_logs_status_check ON function_logs IS 'Ensures status is one of the allowed values used by triggers, Edge Functions, and logging systems.'; 