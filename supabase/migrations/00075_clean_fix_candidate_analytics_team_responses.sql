-- Migration: Clean fix for candidate analytics, team responses, and notifications
-- This migration drops problematic existing tables and creates the correct structure

-- ============================================================================
-- PART 1: Clean up existing problematic tables
-- ============================================================================

-- Drop existing analytics tables that have wrong structure
DROP TABLE IF EXISTS candidate_analytics CASCADE;
DROP TABLE IF EXISTS candidate_response_analytics CASCADE;

-- ============================================================================
-- PART 2: Create correct candidate analytics tables
-- ============================================================================

CREATE TABLE candidate_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Response analytics
    total_responses INTEGER DEFAULT 0,
    average_response_time_seconds DECIMAL(10,2),
    completion_percentage DECIMAL(5,2),
    questions_answered INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    
    -- Score analytics
    overall_score DECIMAL(5,2),
    resume_score DECIMAL(5,2),
    interview_score DECIMAL(5,2),
    ai_score DECIMAL(5,2),
    
    -- Performance metrics
    response_quality_score DECIMAL(5,2),
    communication_score DECIMAL(5,2),
    technical_score DECIMAL(5,2),
    problem_solving_score DECIMAL(5,2),
    
    -- Engagement metrics
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    engagement_level VARCHAR(20) DEFAULT 'low',
    
    -- Comparative metrics
    percentile_rank INTEGER,
    rank_in_job INTEGER,
    total_candidates_in_job INTEGER,
    
    -- AI insights
    ai_recommendation VARCHAR(50),
    confidence_score DECIMAL(5,2),
    strengths_summary TEXT,
    areas_for_improvement TEXT,
    red_flags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_candidate_analytics_candidate_id ON candidate_analytics(candidate_id);
CREATE INDEX idx_candidate_analytics_job_id ON candidate_analytics(job_id);
CREATE INDEX idx_candidate_analytics_overall_score ON candidate_analytics(overall_score DESC);

CREATE TABLE candidate_response_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    response_length_words INTEGER DEFAULT 0,
    response_time_seconds INTEGER DEFAULT 0,
    response_quality_score DECIMAL(5,2),
    sentiment_score DECIMAL(5,2),
    ai_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(candidate_id, response_id)
);

CREATE INDEX idx_candidate_response_analytics_candidate_id ON candidate_response_analytics(candidate_id);
CREATE INDEX idx_candidate_response_analytics_response_id ON candidate_response_analytics(response_id);

-- ============================================================================
-- PART 3: Create get_candidate_analytics function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_candidate_analytics(candidate_uuid UUID, job_uuid UUID)
RETURNS TABLE (
    analytics JSON,
    response_analytics JSON,
    comparative_data JSON,
    ai_assessment JSON
) AS $$
DECLARE
    analytics_record RECORD;
    response_analytics_array JSON;
    comparative_data_json JSON;
    default_analytics JSON;
    ai_assessment_json JSON;
BEGIN
    -- Get main analytics
    SELECT * INTO analytics_record
    FROM candidate_analytics
    WHERE candidate_id = candidate_uuid AND job_id = job_uuid;
    
    -- Create default analytics if none exist
    IF NOT FOUND THEN
        default_analytics := json_build_object(
            'id', null,
            'candidate_id', candidate_uuid,
            'job_id', job_uuid,
            'total_responses', 0,
            'average_response_time_seconds', 0,
            'completion_percentage', 0,
            'questions_answered', 0,
            'total_questions', 0,
            'overall_score', 0,
            'resume_score', 0,
            'interview_score', 0,
            'ai_score', null,
            'response_quality_score', 0,
            'communication_score', null,
            'technical_score', null,
            'problem_solving_score', null,
            'time_spent_minutes', 0,
            'last_activity_at', null,
            'engagement_level', 'low',
            'percentile_rank', 0,
            'rank_in_job', 0,
            'total_candidates_in_job', 0,
            'ai_recommendation', null,
            'confidence_score', null,
            'strengths_summary', null,
            'areas_for_improvement', null,
            'red_flags', null,
            'created_at', null,
            'updated_at', null
        );
    ELSE
        default_analytics := to_json(analytics_record);
    END IF;
    
    -- Get response analytics
    SELECT json_agg(
        json_build_object(
            'response_id', ra.response_id,
            'response_length_words', ra.response_length_words,
            'response_time_seconds', ra.response_time_seconds,
            'response_quality_score', ra.response_quality_score,
            'sentiment_score', ra.sentiment_score,
            'ai_score', ra.ai_score
        )
    ) INTO response_analytics_array
    FROM candidate_response_analytics ra
    WHERE ra.candidate_id = candidate_uuid;
    
    -- Get comparative data
    SELECT 
        json_build_object(
            'total_candidates', COUNT(*),
            'average_score', ROUND(AVG(COALESCE(overall_score, 0))::numeric, 2),
            'top_percentile', ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY COALESCE(overall_score, 0))::numeric, 2),
            'median_score', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(overall_score, 0))::numeric, 2),
            'completion_rate', ROUND(AVG(COALESCE(completion_percentage, 0))::numeric, 2),
            'average_time_spent', ROUND(AVG(COALESCE(time_spent_minutes, 0))::numeric, 2)
        ) INTO comparative_data_json
    FROM candidate_analytics
    WHERE job_id = job_uuid;
    
    -- Get AI assessment from ai_evaluations table
    SELECT 
        json_build_object(
            'overall_score', ae.overall_score,
            'summary', ae.summary,
            'strengths', ae.strengths,
            'areas_for_improvement', ae.areas_for_improvement,
            'red_flags', ae.red_flags,
            'confidence_score', ae.confidence_score,
            'created_at', ae.created_at
        ) INTO ai_assessment_json
    FROM ai_evaluations ae
    WHERE ae.candidate_id = candidate_uuid AND ae.job_id = job_uuid
    ORDER BY ae.created_at DESC
    LIMIT 1;
    
    RETURN QUERY SELECT
        default_analytics as analytics,
        COALESCE(response_analytics_array, '[]'::json) as response_analytics,
        comparative_data_json as comparative_data,
        ai_assessment_json as ai_assessment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Fix team_responses table structure
-- ============================================================================

-- Drop the old team_responses table and recreate with correct structure
DROP TABLE IF EXISTS team_responses CASCADE;

CREATE TABLE team_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Response data
    vote TEXT NOT NULL CHECK (vote IN ('positive', 'negative', 'neutral')),
    comment TEXT,
    confidence_level INTEGER DEFAULT 5 CHECK (confidence_level >= 1 AND confidence_level <= 10),
    
    -- Skills assessment (optional detailed evaluation)
    technical_skills INTEGER CHECK (technical_skills >= 1 AND technical_skills <= 10),
    communication_skills INTEGER CHECK (communication_skills >= 1 AND communication_skills <= 10),
    cultural_fit INTEGER CHECK (cultural_fit >= 1 AND cultural_fit <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(candidate_id, job_id, user_id)
);

CREATE INDEX idx_team_responses_candidate_id ON team_responses(candidate_id);
CREATE INDEX idx_team_responses_job_id ON team_responses(job_id);
CREATE INDEX idx_team_responses_user_id ON team_responses(user_id);
CREATE INDEX idx_team_responses_vote ON team_responses(vote);

-- ============================================================================
-- PART 5: Add missing columns to existing notifications table if needed
-- ============================================================================

-- Add job_id and candidate_id columns if they don't exist
DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add entity_type and entity_id columns if they don't exist (for compatibility)
DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN entity_type VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN entity_id UUID;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Create additional indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_notifications_job_id ON notifications(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_candidate_id ON notifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type ON notifications(entity_type);

-- ============================================================================
-- PART 6: Function to notify job team members
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_job_team_members(
    p_job_id UUID,
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_candidate_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_exclude_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    team_member RECORD;
BEGIN
    -- Notify job owner
    INSERT INTO notifications (
        user_id, company_id, job_id, candidate_id, type, title, message, 
        category, entity_type, entity_id, related_entity_type, related_entity_id, metadata
    )
    SELECT 
        j.profile_id, 
        (SELECT company_id FROM profiles WHERE id = j.profile_id),
        p_job_id, 
        p_candidate_id, 
        p_notification_type, 
        p_title, 
        p_message, 
        p_entity_type,
        p_entity_type,
        p_entity_id,
        p_entity_type,
        p_entity_id,
        p_metadata
    FROM jobs j
    WHERE j.id = p_job_id 
    AND j.profile_id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- Notify team members with permissions
    FOR team_member IN 
        SELECT DISTINCT jp.user_id
        FROM job_permissions jp
        WHERE jp.job_id = p_job_id
        AND jp.user_id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
        INSERT INTO notifications (
            user_id, company_id, job_id, candidate_id, type, title, message,
            category, entity_type, entity_id, related_entity_type, related_entity_id, metadata
        ) VALUES (
            team_member.user_id, 
            (SELECT company_id FROM profiles WHERE id = team_member.user_id),
            p_job_id, 
            p_candidate_id, 
            p_notification_type,
            p_title, 
            p_message,
            p_entity_type,
            p_entity_type,
            p_entity_id,
            p_entity_type,
            p_entity_id,
            p_metadata
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: Triggers for automatic notifications
-- ============================================================================

-- Function to handle evaluation notifications
CREATE OR REPLACE FUNCTION trigger_evaluation_notification()
RETURNS TRIGGER AS $$
DECLARE
    candidate_name TEXT;
    job_title TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get candidate and job info
    SELECT 
        COALESCE(ci.first_name || ' ' || ci.last_name, 'Unknown Candidate'),
        j.title
    INTO candidate_name, job_title
    FROM candidates c
    LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
    JOIN jobs j ON c.job_id = j.id
    WHERE c.id = NEW.candidate_id;
    
    IF TG_OP = 'INSERT' THEN
        notification_title := 'New Evaluation Created';
        notification_message := 'A new evaluation has been created for ' || candidate_name || ' in ' || job_title;
    ELSE
        notification_title := 'Evaluation Updated';
        notification_message := 'The evaluation for ' || candidate_name || ' in ' || job_title || ' has been updated';
    END IF;
    
    -- Notify team members
    PERFORM notify_job_team_members(
        NEW.job_id,
        CASE WHEN TG_OP = 'INSERT' THEN 'evaluation_created' ELSE 'evaluation_updated' END,
        notification_title,
        notification_message,
        'evaluation',
        NEW.id,
        NEW.candidate_id,
        json_build_object(
            'evaluator_id', NEW.profile_id,
            'score', NEW.score,
            'recommendation', NEW.recommendation
        )::jsonb,
        NEW.profile_id -- Exclude the evaluator from notifications
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle team response notifications
CREATE OR REPLACE FUNCTION trigger_team_response_notification()
RETURNS TRIGGER AS $$
DECLARE
    candidate_name TEXT;
    job_title TEXT;
    user_name TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get candidate, job, and user info
    SELECT 
        COALESCE(ci.first_name || ' ' || ci.last_name, 'Unknown Candidate'),
        j.title,
        COALESCE(p.first_name || ' ' || p.last_name, 'Team Member')
    INTO candidate_name, job_title, user_name
    FROM candidates c
    LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
    JOIN jobs j ON c.job_id = j.id
    JOIN profiles p ON p.id = NEW.user_id
    WHERE c.id = NEW.candidate_id;
    
    notification_title := 'New Team Response';
    notification_message := user_name || ' has provided feedback for ' || candidate_name || ' in ' || job_title;
    
    -- Notify team members
    PERFORM notify_job_team_members(
        NEW.job_id,
        'team_response_added',
        notification_title,
        notification_message,
        'team_response',
        NEW.id,
        NEW.candidate_id,
        json_build_object(
            'responder_id', NEW.user_id,
            'vote', NEW.vote,
            'confidence_level', NEW.confidence_level
        )::jsonb,
        NEW.user_id -- Exclude the responder from notifications
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_evaluation_notifications ON evaluations;
CREATE TRIGGER trigger_evaluation_notifications
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_evaluation_notification();

DROP TRIGGER IF EXISTS trigger_team_response_notifications ON team_responses;
CREATE TRIGGER trigger_team_response_notifications
    AFTER INSERT OR UPDATE ON team_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_team_response_notification();

-- ============================================================================
-- PART 8: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE candidate_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_response_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_responses ENABLE ROW LEVEL SECURITY;

-- Policies for candidate_analytics
CREATE POLICY "Users can view analytics for their jobs" ON candidate_analytics
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs WHERE profile_id = auth.uid()
        ) OR
        job_id IN (
            SELECT job_id FROM job_permissions WHERE user_id = auth.uid()
        )
    );

-- Policies for candidate_response_analytics
CREATE POLICY "Users can view response analytics for their jobs" ON candidate_response_analytics
    FOR SELECT USING (
        candidate_id IN (
            SELECT c.id FROM candidates c
            JOIN jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        ) OR
        candidate_id IN (
            SELECT c.id FROM candidates c
            JOIN job_permissions jp ON c.job_id = jp.job_id
            WHERE jp.user_id = auth.uid()
        )
    );

-- Policies for team_responses
CREATE POLICY "Users can view team responses for accessible jobs" ON team_responses
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs WHERE profile_id = auth.uid()
        ) OR
        job_id IN (
            SELECT job_id FROM job_permissions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert team responses for accessible jobs" ON team_responses
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND (
            job_id IN (
                SELECT id FROM jobs WHERE profile_id = auth.uid()
            ) OR
            job_id IN (
                SELECT job_id FROM job_permissions WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own team responses" ON team_responses
    FOR UPDATE USING (user_id = auth.uid()); 