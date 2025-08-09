-- Fix Function and Trigger Only Migration
-- This migration only fixes the essential function return type and adds AI evaluation trigger

-- ============================================================================
-- PART 1: Fix get_job_candidate_details function return type
-- ============================================================================

-- Drop and recreate the function with correct return types
DROP FUNCTION IF EXISTS get_job_candidate_details(uuid,text,text,integer,integer);

CREATE OR REPLACE FUNCTION get_job_candidate_details(
    p_job_id uuid,
    p_search text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    candidate_info_id uuid,
    job_id uuid,
    interview_token text,
    email text,
    first_name text,
    last_name text,
    full_name text,
    current_step integer,
    total_steps integer,
    is_completed boolean,
    submitted_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    progress_percentage integer, -- Changed from numeric to integer
    job_title text,
    job_status text,
    profile_id uuid,
    job_fields jsonb,
    response_count bigint,
    evaluation_id uuid,
    score integer,
    recommendation text,
    summary text,
    strengths jsonb,
    red_flags jsonb,
    skills_assessment jsonb,
    traits_assessment jsonb,
    evaluation_created_at timestamptz,
    evaluation_type text,
    resume_score integer,
    resume_summary text,
    resume_id uuid,
    resume_filename text,
    resume_file_path text,
    resume_public_url text,
    resume_file_size integer,
    resume_file_type text,
    resume_word_count integer,
    resume_parsing_status text,
    resume_parsing_error text,
    resume_uploaded_at timestamptz,
    candidate_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.candidate_info_id,
        cd.job_id,
        cd.interview_token,
        cd.email,
        cd.first_name,
        cd.last_name,
        cd.full_name,
        cd.current_step,
        cd.total_steps,
        cd.is_completed,
        cd.submitted_at,
        cd.created_at,
        cd.updated_at,
        ROUND(cd.progress_percentage)::integer, -- Convert to integer
        cd.job_title,
        cd.job_status,
        cd.profile_id,
        cd.job_fields,
        cd.response_count,
        cd.evaluation_id,
        cd.score,
        cd.recommendation,
        cd.summary,
        cd.strengths,
        cd.red_flags,
        cd.skills_assessment,
        cd.traits_assessment,
        cd.evaluation_created_at,
        cd.evaluation_type,
        cd.resume_score,
        cd.resume_summary,
        cd.resume_id,
        cd.resume_filename,
        cd.resume_file_path,
        cd.resume_public_url,
        cd.resume_file_size,
        cd.resume_file_type,
        cd.resume_word_count,
        cd.resume_parsing_status,
        cd.resume_parsing_error,
        cd.resume_uploaded_at,
        cd.candidate_status::text
    FROM candidate_details cd
    WHERE cd.job_id = p_job_id
    AND (p_search IS NULL OR 
         cd.full_name ILIKE '%' || p_search || '%' OR 
         cd.email ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR cd.candidate_status::text = p_status)
    ORDER BY cd.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================================================
-- PART 2: Add missing columns to function_logs table if needed
-- ============================================================================

-- Add missing columns to existing function_logs table
DO $$
BEGIN
    -- Add candidate_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'function_logs' 
        AND column_name = 'candidate_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE function_logs ADD COLUMN candidate_id UUID;
        ALTER TABLE function_logs ADD CONSTRAINT fk_function_logs_candidate_id 
            FOREIGN KEY (candidate_id) REFERENCES candidates(id);
    END IF;
    
    -- Add job_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'function_logs' 
        AND column_name = 'job_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE function_logs ADD COLUMN job_id UUID;
        ALTER TABLE function_logs ADD CONSTRAINT fk_function_logs_job_id 
            FOREIGN KEY (job_id) REFERENCES jobs(id);
    END IF;
    
    -- Add message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'function_logs' 
        AND column_name = 'message'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE function_logs ADD COLUMN message TEXT;
    END IF;
END $$;

-- Create indexes for function_logs
CREATE INDEX IF NOT EXISTS idx_function_logs_candidate_id ON function_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_job_id ON function_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_created_at ON function_logs(created_at);

-- Enable http extension for Edge Function calls
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================================================
-- PART 3: Create AI evaluation trigger
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_candidate_completion_ai_evaluation ON candidates;
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation_completion();

-- Create simplified AI evaluation trigger function
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
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id AND job_id = NEW.job_id
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
      
      -- Prepare the request body
      request_body := jsonb_build_object(
        'candidateId', NEW.id,
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

-- Create the trigger
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
-- PART 4: Verification
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_job_candidate_details'
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_candidate_completion_ai_evaluation'
        AND event_object_table = 'candidates'
    ) INTO trigger_exists;
    
    RAISE NOTICE '✅ Function and Trigger Fix Applied';
    RAISE NOTICE '  - Function exists: %', function_exists;
    RAISE NOTICE '  - AI evaluation trigger exists: %', trigger_exists;
    
    IF function_exists AND trigger_exists THEN
        RAISE NOTICE '  - ✅ All fixes applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some fixes may need manual verification';
    END IF;
END $$; 