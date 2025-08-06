-- Drop and recreate the AI evaluation trigger and manual trigger functions to ensure compatibility with unique candidate IDs
DROP TRIGGER IF EXISTS candidates_ai_evaluation_trigger ON candidates;
DROP FUNCTION IF EXISTS trigger_ai_evaluation();
DROP FUNCTION IF EXISTS manual_trigger_ai_evaluation(UUID, BOOLEAN);

-- Recreate the trigger function (logic unchanged, but now works with unique candidate IDs)
CREATE OR REPLACE FUNCTION trigger_ai_evaluation()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_payload JSONB;
BEGIN
  -- Only trigger if is_completed changed from false to true
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    -- Check if evaluation already exists for this specific candidate-job combination
    IF NOT EXISTS (
      SELECT 1 FROM ai_evaluations 
      WHERE candidate_id = NEW.candidate_info_id AND job_id = NEW.job_id
    ) THEN
      RAISE NOTICE 'AI evaluation trigger fired for candidate: %, job: %', NEW.candidate_info_id, NEW.job_id;
      function_url := 'https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/ai-candidate-evaluation';
      request_payload := jsonb_build_object(
        'candidateId', NEW.candidate_info_id,
        'jobId', NEW.job_id
      );
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
        NEW.candidate_info_id,
        NEW.job_id
      );
      RAISE NOTICE 'AI evaluation trigger fired for candidate: %, job: %', NEW.id, NEW.job_id;
    ELSE
      INSERT INTO function_logs (
        function_name,
        payload,
        triggered_at,
        candidate_id,
        job_id
      ) VALUES (
        'ai-evaluation-skipped',
        jsonb_build_object(
          'candidateId', NEW.candidate_info_id,
          'jobId', NEW.job_id,
          'reason', 'AI evaluation already exists for this candidate-job combination'
        ),
        NOW(),
        NEW.id,
        NEW.job_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER candidates_ai_evaluation_trigger
  AFTER UPDATE OF is_completed ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_evaluation();

-- Recreate the manual trigger function (logic unchanged)
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
  IF NOT candidate_record.is_completed AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidate interview not completed'
    );
  END IF;
  IF EXISTS (SELECT 1 FROM ai_evaluations WHERE candidate_id = p_candidate_id AND job_id = candidate_record.job_id) AND NOT p_force THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'AI evaluation already exists for this candidate-job combination'
    );
  END IF;
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
  RETURN jsonb_build_object(
    'success', true,
    'candidateId', candidate_record.id,
    'jobId', candidate_record.job_id,
    'profileId', candidate_record.profile_id,
    'message', 'Manual AI evaluation trigger logged. Call the Edge Function with these parameters.'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO anon;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO authenticator;
GRANT EXECUTE ON FUNCTION trigger_ai_evaluation() TO service_role;
GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_trigger_ai_evaluation(UUID, BOOLEAN) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION trigger_ai_evaluation IS 'Automatically triggers AI evaluation when candidate completes application (now supports multiple applications per person).';
COMMENT ON FUNCTION manual_trigger_ai_evaluation IS 'Manually trigger AI evaluation for a specific candidate (now supports multiple applications per person).';
COMMENT ON TRIGGER candidates_ai_evaluation_trigger ON candidates IS 'Automatically triggers AI evaluation when is_completed changes to true.'; 