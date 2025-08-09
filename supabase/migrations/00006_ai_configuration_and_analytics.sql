-- AI Configuration and Analytics Migration
-- This migration adds AI preferences, usage tracking, and advanced evaluation features

-- Create AI preferences table for storing user/company AI model configurations
CREATE TABLE IF NOT EXISTS ai_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_configs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per user per company
  UNIQUE(user_id, company_id)
);

-- Create AI model usage tracking table for analytics and billing
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL,
  capability VARCHAR(50) NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate analytics table
CREATE TABLE IF NOT EXISTS candidate_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_text TEXT,
    resume_score INTEGER DEFAULT 0,
    resume_analysis JSONB DEFAULT '{}',
    skills_extracted JSONB DEFAULT '[]',
    experience_years INTEGER,
    education_level TEXT,
    certifications JSONB DEFAULT '[]',
    red_flags JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    ai_summary TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidate_id, job_id)
);

-- Create candidate response analytics table
CREATE TABLE IF NOT EXISTS candidate_response_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_text TEXT,
    response_text TEXT NOT NULL,
    sentiment_score DECIMAL(3,2) DEFAULT 0.0,
    readability_score DECIMAL(3,2) DEFAULT 0.0,
    keyword_matches JSONB DEFAULT '[]',
    response_quality TEXT CHECK (response_quality IN ('excellent', 'good', 'average', 'poor')),
    ai_insights JSONB DEFAULT '{}',
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidate_id, response_id)
);

-- Create function logs table for debugging AI operations
CREATE TABLE IF NOT EXISTS function_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name VARCHAR(100) NOT NULL,
    payload JSONB,
    response JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service config table for system settings
CREATE TABLE IF NOT EXISTS service_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add enhanced fields to companies table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'bio') THEN
        ALTER TABLE companies ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'logo_path') THEN
        ALTER TABLE companies ADD COLUMN logo_path TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'slug') THEN
        ALTER TABLE companies ADD COLUMN slug VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Add enhanced fields to interviews table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interviews' AND column_name = 'reminder_sent_at') THEN
        ALTER TABLE interviews ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for AI tables
CREATE INDEX IF NOT EXISTS idx_ai_preferences_user_id ON ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_preferences_company_id ON ai_preferences(company_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_company_timestamp ON ai_model_usage (company_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_timestamp ON ai_model_usage (user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model_capability ON ai_model_usage (model_id, capability);

CREATE INDEX IF NOT EXISTS idx_candidate_analytics_candidate_id ON candidate_analytics(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_analytics_job_id ON candidate_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_analytics_status ON candidate_analytics(processing_status);
CREATE INDEX IF NOT EXISTS idx_candidate_analytics_score ON candidate_analytics(resume_score);

CREATE INDEX IF NOT EXISTS idx_candidate_response_analytics_candidate_id ON candidate_response_analytics(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_response_analytics_response_id ON candidate_response_analytics(response_id);
CREATE INDEX IF NOT EXISTS idx_candidate_response_analytics_status ON candidate_response_analytics(processing_status);

CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_status ON function_logs(status);
CREATE INDEX IF NOT EXISTS idx_function_logs_created_at ON function_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_service_config_key ON service_config(key);

-- Enable Row Level Security
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_response_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_preferences
CREATE POLICY "Users can view their company AI preferences" ON ai_preferences
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company AI preferences" ON ai_preferences
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for ai_model_usage
CREATE POLICY "Users can view their company AI usage" ON ai_model_usage
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert AI usage data" ON ai_model_usage
  FOR INSERT WITH CHECK (true);

-- RLS Policies for candidate_analytics
CREATE POLICY "Job owners can view analytics for their candidates" ON candidate_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = candidate_analytics.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can manage candidate analytics" ON candidate_analytics
  FOR ALL WITH CHECK (true);

-- RLS Policies for candidate_response_analytics
CREATE POLICY "Job owners can view response analytics for their candidates" ON candidate_response_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      WHERE c.id = candidate_response_analytics.candidate_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can manage response analytics" ON candidate_response_analytics
  FOR ALL WITH CHECK (true);

-- RLS Policies for function_logs
CREATE POLICY "Admins can view function logs" ON function_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "System can insert function logs" ON function_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for service_config
CREATE POLICY "Admins can manage service config" ON service_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Create view for AI usage analytics
CREATE OR REPLACE VIEW ai_usage_analytics AS
SELECT 
  company_id,
  model_id,
  capability,
  DATE_TRUNC('day', timestamp) as usage_date,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost,
  COUNT(*) as request_count,
  AVG(tokens_used) as avg_tokens_per_request
FROM ai_model_usage
GROUP BY company_id, model_id, capability, DATE_TRUNC('day', timestamp);

-- Create view for candidate analytics summary
CREATE OR REPLACE VIEW candidate_analytics_summary AS
SELECT 
  j.id as job_id,
  j.title as job_title,
  j.profile_id,
  COUNT(ca.id) as total_analyzed,
  COUNT(ca.id) FILTER (WHERE ca.processing_status = 'completed') as completed_analyses,
  COUNT(ca.id) FILTER (WHERE ca.processing_status = 'failed') as failed_analyses,
  AVG(ca.resume_score) as avg_resume_score,
  AVG(ca.confidence_score) as avg_confidence_score,
  COUNT(ca.id) FILTER (WHERE ca.resume_score >= 80) as high_score_candidates,
  COUNT(ca.id) FILTER (WHERE ca.resume_score >= 60 AND ca.resume_score < 80) as medium_score_candidates,
  COUNT(ca.id) FILTER (WHERE ca.resume_score < 60) as low_score_candidates
FROM jobs j
LEFT JOIN candidate_analytics ca ON j.id = ca.job_id
GROUP BY j.id, j.title, j.profile_id;

-- Create function to update AI preferences
CREATE OR REPLACE FUNCTION update_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_ai_preferences_updated_at_trigger
  BEFORE UPDATE ON ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_preferences_updated_at();

-- Create function to log AI evaluation requests
CREATE OR REPLACE FUNCTION log_ai_evaluation_request(
  p_function_name VARCHAR,
  p_payload JSONB,
  p_response JSONB DEFAULT NULL,
  p_status VARCHAR DEFAULT 'pending',
  p_error_message TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO function_logs (
    function_name, payload, response, status, error_message, execution_time_ms
  ) VALUES (
    p_function_name, p_payload, p_response, p_status, p_error_message, p_execution_time_ms
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or create AI preferences for a user/company
CREATE OR REPLACE FUNCTION get_or_create_ai_preferences(
  p_user_id UUID,
  p_company_id UUID,
  p_default_config JSONB DEFAULT '{}'::jsonb
)
RETURNS ai_preferences AS $$
DECLARE
  preferences ai_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO preferences
  FROM ai_preferences
  WHERE user_id = p_user_id AND company_id = p_company_id;

  -- If not found, create new preferences
  IF NOT FOUND THEN
    INSERT INTO ai_preferences (user_id, company_id, config, provider_configs)
    VALUES (p_user_id, p_company_id, p_default_config, '{}'::jsonb)
    RETURNING * INTO preferences;
  END IF;

  RETURN preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate candidate score based on analytics
CREATE OR REPLACE FUNCTION calculate_candidate_score(candidate_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  analytics_score INTEGER := 0;
  response_scores NUMERIC;
  final_score INTEGER;
BEGIN
  -- Get resume score from candidate_analytics
  SELECT COALESCE(resume_score, 0) INTO analytics_score
  FROM candidate_analytics
  WHERE candidate_id = candidate_uuid
  LIMIT 1;

  -- Get average response quality scores
  SELECT AVG(
    CASE response_quality
      WHEN 'excellent' THEN 100
      WHEN 'good' THEN 80
      WHEN 'average' THEN 60
      WHEN 'poor' THEN 40
      ELSE 50
    END
  ) INTO response_scores
  FROM candidate_response_analytics
  WHERE candidate_id = candidate_uuid;

  -- Calculate weighted final score (70% analytics, 30% responses)
  final_score := ROUND(
    (analytics_score * 0.7) + (COALESCE(response_scores, 50) * 0.3)
  );

  -- Ensure score is between 0 and 100
  final_score := GREATEST(0, LEAST(100, final_score));

  RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at triggers
CREATE TRIGGER update_candidate_analytics_updated_at
    BEFORE UPDATE ON candidate_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_response_analytics_updated_at
    BEFORE UPDATE ON candidate_response_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_config_updated_at
    BEFORE UPDATE ON service_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_preferences TO authenticated;
GRANT SELECT, INSERT ON ai_model_usage TO authenticated;
GRANT SELECT ON candidate_analytics TO authenticated;
GRANT SELECT ON candidate_response_analytics TO authenticated;
GRANT SELECT ON ai_usage_analytics TO authenticated;
GRANT SELECT ON candidate_analytics_summary TO authenticated;

GRANT EXECUTE ON FUNCTION log_ai_evaluation_request(VARCHAR, JSONB, JSONB, VARCHAR, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_ai_preferences(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_candidate_score(UUID) TO authenticated;

-- Insert some default service configuration
INSERT INTO service_config (key, value, description) VALUES
  ('ai_evaluation_enabled', 'true', 'Enable AI-powered candidate evaluation'),
  ('max_candidates_per_job', '500', 'Maximum number of candidates per job'),
  ('resume_analysis_timeout', '30', 'Timeout for resume analysis in seconds'),
  ('default_ai_model', '{"provider": "openai", "model": "gpt-4", "temperature": 0.7}', 'Default AI model configuration')
ON CONFLICT (key) DO NOTHING; 