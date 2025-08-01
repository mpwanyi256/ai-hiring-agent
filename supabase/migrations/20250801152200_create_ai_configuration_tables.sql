-- Create AI preferences table for storing user/company AI model configurations
CREATE TABLE IF NOT EXISTS ai_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL,
  capability VARCHAR(50) NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for performance
  INDEX idx_ai_usage_company_timestamp (company_id, timestamp),
  INDEX idx_ai_usage_user_timestamp (user_id, timestamp),
  INDEX idx_ai_usage_model_capability (model_id, capability)
);

-- Create RLS policies for ai_preferences
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own company's AI preferences
CREATE POLICY "Users can view their company AI preferences" ON ai_preferences
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company AI preferences" ON ai_preferences
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for ai_model_usage
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their company's usage data
CREATE POLICY "Users can view their company AI usage" ON ai_model_usage
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Only system can insert usage data (API routes)
CREATE POLICY "System can insert AI usage data" ON ai_model_usage
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_preferences TO authenticated;
GRANT SELECT, INSERT ON ai_model_usage TO authenticated;
GRANT SELECT ON ai_usage_analytics TO authenticated;
