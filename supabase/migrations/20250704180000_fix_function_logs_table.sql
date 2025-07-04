-- Fix function_logs table structure and usage inconsistencies
-- This migration recreates the function_logs table with all required fields based on actual usage

-- Drop dependent functions and triggers first
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();
DROP FUNCTION IF EXISTS manual_trigger_ai_evaluation(UUID);
DROP FUNCTION IF EXISTS manual_trigger_ai_evaluation(UUID, BOOLEAN);

-- Drop the existing function_logs table and recreate it with correct structure
DROP TABLE IF EXISTS function_logs CASCADE;

-- Create the function_logs table with all required fields
CREATE TABLE function_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'triggered', 'ready_for_processing', 'skipped', 'success', 'failed')),
  message TEXT NOT NULL,
  payload JSONB,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  error_message TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for function logs
CREATE INDEX IF NOT EXISTS idx_function_logs_candidate_id ON function_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_job_id ON function_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_status ON function_logs(status);
CREATE INDEX IF NOT EXISTS idx_function_logs_triggered_at ON function_logs(triggered_at);
CREATE INDEX IF NOT EXISTS idx_function_logs_message ON function_logs(message);

-- Enable RLS on function_logs
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for function logs
CREATE POLICY "Users can view logs for their jobs" ON function_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
  );

-- Service role can manage function logs
CREATE POLICY "Service role can manage function logs" ON function_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON function_logs TO authenticated;
GRANT ALL ON function_logs TO service_role;

-- Recreate the trigger function with consistent field usage
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  job_profile_id UUID;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Get the profile_id from the job associated with this candidate
    SELECT j.profile_id INTO job_profile_id
    FROM jobs j
    WHERE j.id = NEW.job_id;
    
    -- Log the trigger execution
    INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
    VALUES (
      'ai_evaluation_trigger',
      'triggered',
      'Candidate interview completed, triggering AI evaluation',
      NEW.id,
      NEW.job_id,
      NOW()
    );
    
    -- Check if evaluation already exists
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.id
    ) THEN
      -- Call the Edge Function (this will be handled by the application layer)
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'ready_for_processing',
        'Candidate ready for AI evaluation',
        NEW.id,
        NEW.job_id,
        NOW()
      );
    ELSE
      INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
      VALUES (
        'ai_evaluation_trigger',
        'skipped',
        'AI evaluation already exists for this candidate',
        NEW.id,
        NEW.job_id,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER candidates_ai_evaluation_trigger
  AFTER UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation();

-- Create a manual trigger function that can be called directly
CREATE OR REPLACE FUNCTION manual_trigger_ai_evaluation(p_candidate_id UUID)
RETURNS JSON AS $$
DECLARE
  candidate_record candidates%ROWTYPE;
  job_profile_id UUID;
  result JSON;
BEGIN
  -- Get candidate record
  SELECT * INTO candidate_record FROM candidates WHERE id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
  
  -- Check if candidate is completed
  IF NOT candidate_record.is_completed THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Candidate interview not completed yet'
    );
  END IF;
  
  -- Get the profile_id from the job
  SELECT j.profile_id INTO job_profile_id
  FROM jobs j
  WHERE j.id = candidate_record.job_id;
  
  IF job_profile_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Job or profile not found'
    );
  END IF;
  
  -- Check if evaluation already exists
  IF EXISTS (SELECT 1 FROM ai_evaluations WHERE candidate_id = p_candidate_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'AI evaluation already exists for this candidate'
    );
  END IF;
  
  -- Log the manual trigger
  INSERT INTO function_logs (function_name, status, message, candidate_id, job_id, created_at)
  VALUES (
    'manual_ai_evaluation_trigger',
    'triggered',
    'Manual AI evaluation trigger called',
    p_candidate_id,
    candidate_record.job_id,
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'candidate_id', p_candidate_id,
    'job_id', candidate_record.job_id,
    'profile_id', job_profile_id,
    'message', 'Candidate ready for AI evaluation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on manual trigger function
GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE function_logs IS 'Logs of Edge Function triggers and their status with consistent field structure';
COMMENT ON FUNCTION trigger_ai_evaluation() IS 'Triggers AI evaluation when candidate completes interview. Uses candidate_id and gets profile_id from jobs table.';
COMMENT ON FUNCTION manual_trigger_ai_evaluation(UUID) IS 'Manually trigger AI evaluation for a specific candidate. Returns profile_id needed for Edge Function call.';
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true'; 