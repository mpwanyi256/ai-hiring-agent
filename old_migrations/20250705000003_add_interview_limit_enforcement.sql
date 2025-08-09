-- Add interview limit enforcement trigger
-- This trigger automatically closes jobs when the interview count exceeds the subscription limit

-- Create a function to check and enforce interview limits
CREATE OR REPLACE FUNCTION check_interview_limits()
RETURNS TRIGGER AS $$
DECLARE
  job_profile_id UUID;
  subscription_limit INTEGER;
  current_month_interviews INTEGER;
  job_status TEXT;
BEGIN
  -- Get the profile_id from the job
  SELECT j.profile_id, j.status INTO job_profile_id, job_status
  FROM jobs j
  WHERE j.id = NEW.job_id;
  
  -- Only check limits for jobs that are in 'interviewing' status
  IF job_status != 'interviewing' THEN
    RETURN NEW;
  END IF;
  
  -- Get the subscription limit for this user
  SELECT s.max_interviews_per_month INTO subscription_limit
  FROM user_subscriptions us
  JOIN subscriptions s ON us.subscription_id = s.id
  WHERE us.user_id = job_profile_id 
    AND us.status = 'active';
  
  -- If no subscription found, use free tier limit (5)
  IF subscription_limit IS NULL THEN
    subscription_limit := 5;
  END IF;
  
  -- Count interviews for this user in the current month
  SELECT COUNT(*) INTO current_month_interviews
  FROM candidates ca
  JOIN jobs j ON ca.job_id = j.id
  WHERE j.profile_id = job_profile_id
    AND ca.submitted_at >= date_trunc('month', NOW());
  
  -- If we've reached the limit, close all interviewing jobs for this user
  IF current_month_interviews >= subscription_limit THEN
    UPDATE jobs 
    SET status = 'closed', 
        updated_at = NOW()
    WHERE profile_id = job_profile_id 
      AND status = 'interviewing';
    
    -- Log the enforcement action
    INSERT INTO function_logs (
      function_name, 
      status, 
      message, 
      job_id, 
      created_at
    ) VALUES (
      'interview_limit_enforcement',
      'enforced',
      format('Interview limit reached (%s/month). All interviewing jobs closed for user %s.', 
             subscription_limit, job_profile_id),
      NEW.job_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check limits when a candidate completes an interview
CREATE TRIGGER interview_limit_check_trigger
  AFTER UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION check_interview_limits();

-- Create a function to manually check limits for a specific user
CREATE OR REPLACE FUNCTION check_user_interview_limits(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  subscription_limit INTEGER;
  current_month_interviews INTEGER;
  active_jobs_count INTEGER;
  result JSON;
BEGIN
  -- Get the subscription limit for this user
  SELECT s.max_interviews_per_month INTO subscription_limit
  FROM user_subscriptions us
  JOIN subscriptions s ON us.subscription_id = s.id
  WHERE us.user_id = p_user_id 
    AND us.status = 'active';
  
  -- If no subscription found, use free tier limit (5)
  IF subscription_limit IS NULL THEN
    subscription_limit := 5;
  END IF;
  
  -- Count interviews for this user in the current month
  SELECT COUNT(*) INTO current_month_interviews
  FROM candidates ca
  JOIN jobs j ON ca.job_id = j.id
  WHERE j.profile_id = p_user_id
    AND ca.submitted_at >= date_trunc('month', NOW());
  
  -- Count active interviewing jobs
  SELECT COUNT(*) INTO active_jobs_count
  FROM jobs
  WHERE profile_id = p_user_id 
    AND status = 'interviewing';
  
  -- Return the limit information
  RETURN json_build_object(
    'user_id', p_user_id,
    'subscription_limit', subscription_limit,
    'current_month_interviews', current_month_interviews,
    'remaining_interviews', GREATEST(0, subscription_limit - current_month_interviews),
    'active_interviewing_jobs', active_jobs_count,
    'limit_reached', current_month_interviews >= subscription_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the manual check function
GRANT EXECUTE ON FUNCTION check_user_interview_limits(UUID) TO authenticated;

-- Create a function to get interview usage statistics for a user
CREATE OR REPLACE FUNCTION get_user_interview_usage(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  subscription_info JSON;
  usage_info JSON;
  result JSON;
BEGIN
  -- Get subscription information
  SELECT json_build_object(
    'subscription_name', s.name,
    'max_interviews_per_month', s.max_interviews_per_month,
    'subscription_status', us.status
  ) INTO subscription_info
  FROM user_subscriptions us
  JOIN subscriptions s ON us.subscription_id = s.id
  WHERE us.user_id = p_user_id 
    AND us.status = 'active';
  
  -- Get usage information
  SELECT json_build_object(
    'interviews_this_month', (
      SELECT COUNT(*) 
      FROM candidates ca
      JOIN jobs j ON ca.job_id = j.id
      WHERE j.profile_id = p_user_id
        AND ca.submitted_at >= date_trunc('month', NOW())
    ),
    'interviews_last_month', (
      SELECT COUNT(*) 
      FROM candidates ca
      JOIN jobs j ON ca.job_id = j.id
      WHERE j.profile_id = p_user_id
        AND ca.submitted_at >= date_trunc('month', NOW() - INTERVAL '1 month')
        AND ca.submitted_at < date_trunc('month', NOW())
    ),
    'total_interviews', (
      SELECT COUNT(*) 
      FROM candidates ca
      JOIN jobs j ON ca.job_id = j.id
      WHERE j.profile_id = p_user_id
    ),
    'active_interviewing_jobs', (
      SELECT COUNT(*) 
      FROM jobs
      WHERE profile_id = p_user_id 
        AND status = 'interviewing'
    )
  ) INTO usage_info;
  
  -- Combine the information
  result := json_build_object(
    'user_id', p_user_id,
    'subscription', subscription_info,
    'usage', usage_info
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the usage function
GRANT EXECUTE ON FUNCTION get_user_interview_usage(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION check_interview_limits() IS 'Automatically closes jobs when interview limit is reached';
COMMENT ON FUNCTION check_user_interview_limits(UUID) IS 'Manually check interview limits for a specific user';
COMMENT ON FUNCTION get_user_interview_usage(UUID) IS 'Get detailed interview usage statistics for a user'; 