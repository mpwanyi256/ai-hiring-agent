-- Create trigger to automatically trigger AI evaluation when candidate completes interview
-- This migration sets up automatic evaluation when is_completed changes to true

-- Create function to trigger AI evaluation Edge Function
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    
    -- Get the Supabase function URL from environment or construct it
    -- In production, this would be your actual Supabase project URL
    function_url := 'https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/ai-candidate-evaluation';
    
    -- Prepare payload for the Edge Function
    request_payload := jsonb_build_object(
      'candidateId', NEW.id,
      'jobId', NEW.job_id,
      'profileId', (
        SELECT profile_id 
        FROM jobs 
        WHERE id = NEW.job_id
      )
    );
    
    -- Log the trigger event
    INSERT INTO public.function_logs (
      function_name,
      payload,
      triggered_at,
      candidate_id,
      job_id
    ) VALUES (
      'ai-candidate-evaluation',
      request_payload,
      NOW(),
      NEW.id,
      NEW.job_id
    );
    
    -- Note: In a real implementation, you would call the Edge Function here
    -- using pg_net extension or a similar HTTP client
    -- For now, we'll just log the event and rely on manual triggering
    
    RAISE NOTICE 'AI evaluation trigger fired for candidate: %, job: %', NEW.id, NEW.job_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create logs table for tracking function calls
CREATE TABLE IF NOT EXISTS function_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger on candidates table
CREATE TRIGGER candidates_ai_evaluation_trigger
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation();

-- Create indexes for function logs
CREATE INDEX IF NOT EXISTS idx_function_logs_candidate_id ON function_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_job_id ON function_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_status ON function_logs(status);
CREATE INDEX IF NOT EXISTS idx_function_logs_triggered_at ON function_logs(triggered_at);

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

-- Create helper function to manually trigger AI evaluation
CREATE OR REPLACE FUNCTION manual_trigger_ai_evaluation(
  p_candidate_id UUID,
  p_force BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  candidate_record RECORD;
  result JSONB;
BEGIN
  -- Get candidate with job info
  SELECT c.*, j.profile_id, j.title as job_title
  INTO candidate_record
  FROM candidates c
  JOIN jobs j ON c.job_id = j.id
  WHERE c.id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidate not found'
    );
  END IF;
  
  -- Check if candidate interview is completed
  IF NOT candidate_record.is_completed AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidate interview not completed'
    );
  END IF;
  
  -- Check if AI evaluation already exists
  IF EXISTS (SELECT 1 FROM ai_evaluations WHERE candidate_id = p_candidate_id) AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'AI evaluation already exists for this candidate'
    );
  END IF;
  
  -- Log the manual trigger
  INSERT INTO function_logs (
    function_name,
    payload,
    triggered_at,
    candidate_id,
    job_id
  ) VALUES (
    'ai-candidate-evaluation-manual',
    jsonb_build_object(
      'candidateId', candidate_record.id,
      'jobId', candidate_record.job_id,
      'profileId', candidate_record.profile_id,
      'force', p_force
    ),
    NOW(),
    candidate_record.id,
    candidate_record.job_id
  );
  
  -- Return success with details for manual processing
  RETURN jsonb_build_object(
    'success', true,
    'candidateId', candidate_record.id,
    'jobId', candidate_record.job_id,
    'profileId', candidate_record.profile_id,
    'message', 'Manual AI evaluation trigger logged. Call the Edge Function with these parameters.'
  );
END;
$$;

-- Grant execute permission on manual trigger function
GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID, BOOLEAN) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation when candidate completes interview';
COMMENT ON FUNCTION manual_trigger_ai_evaluation IS 'Manually trigger AI evaluation for a specific candidate';
COMMENT ON TABLE function_logs IS 'Logs of Edge Function triggers and their status';

COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true'; 