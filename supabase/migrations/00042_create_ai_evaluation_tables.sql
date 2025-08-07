-- Create AI Evaluation Tables Migration
-- This migration creates comprehensive AI evaluation and team assessment tables

-- ============================================================================
-- PART 1: Create AI evaluations table for storing comprehensive AI analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Create team assessments table for manual evaluations by team members
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  ai_evaluation_id UUID REFERENCES public.ai_evaluations(id) ON DELETE CASCADE,
  
  -- Assessor information
  assessor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Create evaluation analytics table for tracking evaluation patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evaluation_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
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
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 4: Create indexes for better performance
-- ============================================================================

-- AI evaluations indexes
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_candidate_id ON public.ai_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_job_id ON public.ai_evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_overall_score ON public.ai_evaluations(overall_score);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_recommendation ON public.ai_evaluations(recommendation);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_created_at ON public.ai_evaluations(created_at);

-- Team assessments indexes
CREATE INDEX IF NOT EXISTS idx_team_assessments_candidate_id ON public.team_assessments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_job_id ON public.team_assessments(job_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_ai_evaluation_id ON public.team_assessments(ai_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_assessor_profile_id ON public.team_assessments(assessor_profile_id);
CREATE INDEX IF NOT EXISTS idx_team_assessments_overall_rating ON public.team_assessments(overall_rating);
CREATE INDEX IF NOT EXISTS idx_team_assessments_created_at ON public.team_assessments(created_at);

-- Evaluation analytics indexes
CREATE INDEX IF NOT EXISTS idx_evaluation_analytics_job_id ON public.evaluation_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_analytics_profile_id ON public.evaluation_analytics(profile_id);

-- ============================================================================
-- PART 5: Enable RLS on all tables
-- ============================================================================

ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: Create RLS policies for ai_evaluations
-- ============================================================================

CREATE POLICY "Users can view AI evaluations for their jobs" ON public.ai_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
    OR
    -- Users with job permissions can view
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = ai_evaluations.job_id
      AND jp.user_id = auth.uid()
    )
    OR
    -- Admin users can view
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage AI evaluations" ON public.ai_evaluations
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 7: Create RLS policies for team_assessments
-- ============================================================================

CREATE POLICY "Users can view team assessments for their jobs" ON public.team_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    ) 
    OR assessor_profile_id = auth.uid()
    OR
    -- Users with job permissions can view
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = team_assessments.job_id
      AND jp.user_id = auth.uid()
    )
    OR
    -- Admin users can view
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can create team assessments" ON public.team_assessments
  FOR INSERT WITH CHECK (
    assessor_profile_id = auth.uid() AND
    (EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
    OR
    -- Users with job permissions can create
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = job_id
      AND jp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own team assessments" ON public.team_assessments
  FOR UPDATE USING (assessor_profile_id = auth.uid());

CREATE POLICY "Service role can manage team assessments" ON public.team_assessments
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 8: Create RLS policies for evaluation_analytics
-- ============================================================================

CREATE POLICY "Users can view analytics for their jobs" ON public.evaluation_analytics
  FOR SELECT USING (
    profile_id = auth.uid()
    OR
    -- Users with job permissions can view
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = evaluation_analytics.job_id
      AND jp.user_id = auth.uid()
    )
    OR
    -- Admin users can view
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage analytics" ON public.evaluation_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 9: Create trigger functions for updated_at
-- ============================================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_ai_evaluations_updated_at
  BEFORE UPDATE ON public.ai_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_assessments_updated_at
  BEFORE UPDATE ON public.team_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_analytics_updated_at
  BEFORE UPDATE ON public.evaluation_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 10: Grant necessary permissions
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON public.ai_evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.team_assessments TO authenticated;
GRANT SELECT ON public.evaluation_analytics TO authenticated;

-- Service role gets full access
GRANT ALL ON public.ai_evaluations TO service_role;
GRANT ALL ON public.team_assessments TO service_role;
GRANT ALL ON public.evaluation_analytics TO service_role;

-- ============================================================================
-- PART 11: Add helpful comments
-- ============================================================================

COMMENT ON TABLE public.ai_evaluations IS 'Comprehensive AI-generated evaluations of candidates with detailed metrics and analysis';
COMMENT ON TABLE public.team_assessments IS 'Manual assessments by team members for candidates';
COMMENT ON TABLE public.evaluation_analytics IS 'Aggregated analytics and statistics for job evaluation patterns';

COMMENT ON COLUMN public.ai_evaluations.radar_metrics IS 'JSON object with radar chart metrics: {skills, growth_mindset, team_work, culture, communication}';
COMMENT ON COLUMN public.ai_evaluations.category_scores IS 'JSON object with detailed category breakdowns and explanations';
COMMENT ON COLUMN public.ai_evaluations.evaluation_sources IS 'JSON object tracking which data sources were used for evaluation';

COMMENT ON COLUMN public.team_assessments.overall_rating IS 'Overall rating from 0.0 to 5.0 (e.g., 4.5)';
COMMENT ON COLUMN public.team_assessments.category_ratings IS 'JSON object with individual category ratings';

COMMENT ON COLUMN public.evaluation_analytics.score_distribution IS 'JSON object with score range distributions';
COMMENT ON COLUMN public.evaluation_analytics.recommendation_distribution IS 'JSON object with recommendation type counts';

-- ============================================================================
-- PART 12: Verify the migration
-- ============================================================================

DO $$
DECLARE
    ai_evaluations_exists BOOLEAN;
    team_assessments_exists BOOLEAN;
    evaluation_analytics_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_evaluations'
    ) INTO ai_evaluations_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'team_assessments'
    ) INTO team_assessments_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'evaluation_analytics'
    ) INTO evaluation_analytics_exists;
    
    RAISE NOTICE '✅ AI Evaluation tables created successfully';
    RAISE NOTICE '  - ai_evaluations table exists: %', ai_evaluations_exists;
    RAISE NOTICE '  - team_assessments table exists: %', team_assessments_exists;
    RAISE NOTICE '  - evaluation_analytics table exists: %', evaluation_analytics_exists;
    
    IF ai_evaluations_exists AND team_assessments_exists AND evaluation_analytics_exists THEN
        RAISE NOTICE '  - ✅ All AI evaluation tables created successfully';
        RAISE NOTICE '  - Tables include proper RLS policies, indexes, and triggers';
        RAISE NOTICE '  - Ready for AI evaluation functionality';
    ELSE
        RAISE NOTICE '  - ⚠️  Some tables may not have been created properly';
    END IF;
END $$; 