-- Create comprehensive AI evaluation and team assessment tables
-- This migration sets up the database structure for detailed candidate evaluations

-- Create AI evaluations table for storing comprehensive AI analysis
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Overall evaluation results
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('excellent', 'good', 'average', 'poor', 'very_poor')),
  recommendation TEXT NOT NULL CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  
  -- Detailed explanation
  evaluation_summary TEXT NOT NULL,
  evaluation_explanation TEXT NOT NULL,
  
  -- Radar chart metrics (JSON object with 0-100 scores)
  radar_metrics JSONB NOT NULL DEFAULT '{}', -- {skills: 82, growth_mindset: 72, team_work: 85, culture: 78, communication: 90}
  
  -- Detailed category breakdowns
  category_scores JSONB NOT NULL DEFAULT '{}', -- {technical: {score: 85, explanation: "..."}, behavioral: {score: 78, explanation: "..."}}
  
  -- Strengths and areas for improvement
  key_strengths JSONB NOT NULL DEFAULT '[]', -- ["Strong technical skills", "Great communication"]
  areas_for_improvement JSONB NOT NULL DEFAULT '[]', -- ["Leadership experience", "Domain knowledge"]
  red_flags JSONB NOT NULL DEFAULT '[]', -- ["Late to previous jobs", "Communication issues"]
  
  -- Source data used for evaluation
  evaluation_sources JSONB NOT NULL DEFAULT '{}', -- {resume: true, interview: true, previous_evaluations: true}
  
  -- Processing metadata
  processing_duration_ms INTEGER DEFAULT 0,
  ai_model_version TEXT DEFAULT 'gpt-4',
  evaluation_version TEXT DEFAULT '1.0',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team assessments table for manual evaluations by team members
CREATE TABLE IF NOT EXISTS team_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  ai_evaluation_id UUID REFERENCES ai_evaluations(id) ON DELETE CASCADE,
  
  -- Assessor information
  assessor_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessor_name TEXT NOT NULL,
  assessor_role TEXT NOT NULL, -- "Human Resources", "Engineering Manager", etc.
  
  -- Assessment results
  overall_rating DECIMAL(2,1) NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5), -- 4.5, 3.2, etc.
  overall_rating_status TEXT NOT NULL CHECK (overall_rating_status IN ('excellent', 'good', 'average', 'poor', 'very_poor')),
  
  -- Individual category ratings
  category_ratings JSONB NOT NULL DEFAULT '{}', -- {technical: 4.5, communication: 3.8, culture_fit: 4.2}
  
  -- Comments and feedback
  assessment_comments TEXT,
  private_notes TEXT, -- Only visible to assessor and hiring manager
  
  -- Assessment context
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('interview', 'resume_review', 'technical_review', 'culture_interview', 'final_review')),
  interview_duration_minutes INTEGER,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create evaluation analytics table for tracking evaluation patterns
CREATE TABLE IF NOT EXISTS evaluation_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Aggregated statistics
  total_candidates INTEGER DEFAULT 0,
  total_ai_evaluations INTEGER DEFAULT 0,
  total_team_assessments INTEGER DEFAULT 0,
  
  -- Score distributions
  score_distribution JSONB NOT NULL DEFAULT '{}', -- {0-20: 2, 21-40: 5, 41-60: 15, 61-80: 25, 81-100: 8}
  avg_overall_score DECIMAL(5,2) DEFAULT 0,
  avg_team_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Category averages
  avg_radar_metrics JSONB NOT NULL DEFAULT '{}', -- {skills: 75.5, growth_mindset: 68.2, ...}
  
  -- Recommendation distribution
  recommendation_distribution JSONB NOT NULL DEFAULT '{}', -- {strong_yes: 5, yes: 12, maybe: 18, no: 8, strong_no: 2}
  
  -- Last updated
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_candidate_id ON ai_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_job_id ON ai_evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_profile_id ON ai_evaluations(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_overall_score ON ai_evaluations(overall_score);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_recommendation ON ai_evaluations(recommendation);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_created_at ON ai_evaluations(created_at);

CREATE INDEX IF NOT EXISTS idx_team_assessments_candidate_id ON team_assessments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_job_id ON team_assessments(job_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_ai_evaluation_id ON team_assessments(ai_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_assessor_profile_id ON team_assessments(assessor_profile_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_overall_rating ON team_assessments(overall_rating);
CREATE INDEX IF NOT EXISTS idx_team_assessments_created_at ON team_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_evaluation_analytics_job_id ON evaluation_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_analytics_profile_id ON evaluation_analytics(profile_id);

-- Enable RLS on all tables
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_evaluations
CREATE POLICY "Users can view AI evaluations for their jobs" ON ai_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage AI evaluations" ON ai_evaluations
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for team_assessments  
CREATE POLICY "Users can view team assessments for their jobs" ON team_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    ) OR assessor_profile_id = auth.uid()
  );

CREATE POLICY "Users can create team assessments" ON team_assessments
  FOR INSERT WITH CHECK (
    assessor_profile_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own team assessments" ON team_assessments
  FOR UPDATE USING (assessor_profile_id = auth.uid());

-- RLS policies for evaluation_analytics
CREATE POLICY "Users can view analytics for their jobs" ON evaluation_analytics
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Service role can manage analytics" ON evaluation_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_ai_evaluations_updated_at
  BEFORE UPDATE ON ai_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_assessments_updated_at
  BEFORE UPDATE ON team_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_analytics_updated_at
  BEFORE UPDATE ON evaluation_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON ai_evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON team_assessments TO authenticated;
GRANT SELECT ON evaluation_analytics TO authenticated;

-- Service role gets full access
GRANT ALL ON ai_evaluations TO service_role;
GRANT ALL ON team_assessments TO service_role;
GRANT ALL ON evaluation_analytics TO service_role;

-- Add helpful comments
COMMENT ON TABLE ai_evaluations IS 'Comprehensive AI-generated evaluations of candidates with detailed metrics and analysis';
COMMENT ON TABLE team_assessments IS 'Manual assessments by team members for candidates';
COMMENT ON TABLE evaluation_analytics IS 'Aggregated analytics and statistics for job evaluation patterns';

COMMENT ON COLUMN ai_evaluations.radar_metrics IS 'JSON object with radar chart metrics: {skills, growth_mindset, team_work, culture, communication}';
COMMENT ON COLUMN ai_evaluations.category_scores IS 'JSON object with detailed category breakdowns and explanations';
COMMENT ON COLUMN ai_evaluations.evaluation_sources IS 'JSON object tracking which data sources were used for evaluation';

COMMENT ON COLUMN team_assessments.overall_rating IS 'Overall rating from 0.0 to 5.0 (e.g., 4.5)';
COMMENT ON COLUMN team_assessments.category_ratings IS 'JSON object with individual category ratings';

COMMENT ON COLUMN evaluation_analytics.score_distribution IS 'JSON object with score range distributions';
COMMENT ON COLUMN evaluation_analytics.recommendation_distribution IS 'JSON object with recommendation type counts'; 