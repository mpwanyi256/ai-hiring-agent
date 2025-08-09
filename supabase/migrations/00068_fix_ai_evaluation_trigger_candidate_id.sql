-- Fix AI Evaluation Trigger Candidate ID Migration
-- This migration fixes the trigger to pass candidate_info_id instead of candidates.id to the Edge Function

-- ============================================================================
-- PART 1: Fix the trigger function to pass correct candidate ID
-- ============================================================================

-- Drop and recreate the trigger function with correct candidate ID reference
DROP FUNCTION IF EXISTS trigger_ai_evaluation_completion() CASCADE;

CREATE OR REPLACE FUNCTION trigger_ai_evaluation_completion()
RETURNS TRIGGER AS $$
DECLARE
  log_message TEXT;
  edge_function_url TEXT;
  response_status INTEGER;
  response_body TEXT;
  request_body JSONB;
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    -- Check if evaluation already exists for this specific candidate-job combination
    -- Use candidate_info_id for the check since that's what ai_evaluations expects
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.candidate_info_id AND job_id = NEW.job_id
    ) THEN
      -- Log that candidate is ready for processing
      log_message := 'Candidate interview completed, triggering AI evaluation via Edge Function';
      
      -- Insert log entry
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'triggering_edge_function',
        log_message,
        NEW.id,
        NEW.job_id,
        NOW()
      );
      
      -- Get Supabase settings
      supabase_url := 'https://msrspatwjkmyhgqucxuh.supabase.co';
      service_role_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
      
      -- Construct the Edge Function URL
      edge_function_url := supabase_url || '/functions/v1/ai-candidate-evaluation';
      
      -- Prepare the request body - FIXED: Pass candidate_info_id instead of candidates.id
      request_body := jsonb_build_object(
        'candidateId', NEW.candidate_info_id,  -- This is the key fix!
        'jobId', NEW.job_id
      );
      
      -- Call the Edge Function using http extension
      BEGIN
        SELECT 
          status,
          content
        INTO 
          response_status,
          response_body
        FROM 
          http((
            'POST',
            edge_function_url,
            ARRAY[
              ('Authorization', 'Bearer ' || service_role_key)::http_header,
              ('Content-Type', 'application/json')::http_header
            ],
            'application/json',
            request_body::text
          ));
        
        -- Log the Edge Function response
        INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at, payload, response)
        VALUES (
          'ai_evaluation_trigger',
          CASE 
            WHEN response_status BETWEEN 200 AND 299 THEN 'edge_function_success'
            ELSE 'edge_function_error'
          END,
          'Edge Function response: ' || response_status,
          NEW.id,
          NEW.job_id,
          NOW(),
          request_body,
          jsonb_build_object('status', response_status, 'body', response_body)
        );
        
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the transaction
          INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at, error_message)
          VALUES (
            'ai_evaluation_trigger',
            'edge_function_call_error',
            'Failed to call Edge Function: ' || SQLERRM,
            NEW.id,
            NEW.job_id,
            NOW(),
            SQLERRM
          );
      END;
      
    ELSE
      -- Log that evaluation already exists
      log_message := 'AI evaluation already exists for this candidate-job combination';
      
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'skipped',
        log_message,
        NEW.id,
        NEW.job_id,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors that occur during the trigger execution
    INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at, error_message)
    VALUES (
      'ai_evaluation_trigger',
      'error',
      'Error in trigger execution: ' || SQLERRM,
      NEW.id,
      NEW.job_id,
      NOW(),
      SQLERRM
    );
    
    -- Don't re-raise the error to avoid breaking the candidate completion
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_candidate_completion_ai_evaluation
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation_completion();

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO anon;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO authenticator;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation_completion() TO service_role;

-- ============================================================================
-- PART 2: Update ai_evaluations foreign key constraint to reference candidates_info
-- ============================================================================

-- First, drop the existing constraint
ALTER TABLE ai_evaluations 
DROP CONSTRAINT IF EXISTS ai_evaluations_candidate_id_fkey;

-- Add the correct foreign key constraint to reference candidates_info table
ALTER TABLE ai_evaluations 
ADD CONSTRAINT ai_evaluations_candidate_id_fkey 
FOREIGN KEY (candidate_id) REFERENCES candidates_info(id) ON DELETE CASCADE;

-- ============================================================================
-- PART 3: Verification
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
    constraint_fixed BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'trigger_ai_evaluation_completion'
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_candidate_completion_ai_evaluation'
        AND event_object_table = 'candidates'
    ) INTO trigger_exists;
    
    -- Check if constraint is fixed
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
        WHERE c.contype = 'f' 
          AND conrelid::regclass::text = 'ai_evaluations'
          AND a.attname = 'candidate_id'
          AND confrelid::regclass::text = 'candidates_info'
    ) INTO constraint_fixed;
    
    RAISE NOTICE '✅ AI Evaluation Trigger Candidate ID Fix Applied';
    RAISE NOTICE '  - Trigger function exists: %', function_exists;
    RAISE NOTICE '  - Trigger exists: %', trigger_exists;
    RAISE NOTICE '  - Foreign key constraint fixed: %', constraint_fixed;
    
    IF function_exists AND trigger_exists AND constraint_fixed THEN
        RAISE NOTICE '  - ✅ All fixes applied successfully';
        RAISE NOTICE '  - 🔧 Trigger now passes candidate_info_id instead of candidates.id';
        RAISE NOTICE '  - 🔧 Foreign key now references candidates_info table';
    ELSE
        RAISE NOTICE '  - ⚠️  Some fixes may need manual verification';
    END IF;
END $$; 