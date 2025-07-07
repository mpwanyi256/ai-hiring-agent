-- Migration: Add candidate analytics tables and functions
-- This migration adds comprehensive analytics capabilities for candidates

-- Create candidate_analytics table for storing computed analytics
CREATE TABLE IF NOT EXISTS candidate_analytics (
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
    engagement_level VARCHAR(20) DEFAULT 'low', -- low, medium, high
    
    -- Comparative metrics
    percentile_rank INTEGER, -- 1-100
    rank_in_job INTEGER,
    total_candidates_in_job INTEGER,
    
    -- AI insights
    ai_recommendation VARCHAR(50),
    confidence_score DECIMAL(5,2),
    strengths_summary TEXT,
    areas_for_improvement TEXT,
    red_flags TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(candidate_id, job_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_candidate_analytics_candidate_id ON candidate_analytics(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_analytics_job_id ON candidate_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_analytics_overall_score ON candidate_analytics(overall_score DESC);

-- Create candidate_response_analytics table for detailed response insights
CREATE TABLE IF NOT EXISTS candidate_response_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    
    -- Response metrics
    response_length_words INTEGER,
    response_time_seconds INTEGER,
    response_quality_score DECIMAL(5,2),
    
    -- Content analysis
    keyword_matches INTEGER,
    technical_terms_count INTEGER,
    grammar_score DECIMAL(5,2),
    clarity_score DECIMAL(5,2),
    
    -- Sentiment analysis
    sentiment_score DECIMAL(3,2), -- -1 to 1
    confidence_level DECIMAL(5,2),
    emotional_tone VARCHAR(50),
    
    -- AI evaluation
    ai_feedback TEXT,
    ai_score DECIMAL(5,2),
    improvement_suggestions TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(candidate_id, response_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_candidate_response_analytics_candidate_id ON candidate_response_analytics(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_response_analytics_response_id ON candidate_response_analytics(response_id);

-- Function to calculate candidate analytics
CREATE OR REPLACE FUNCTION calculate_candidate_analytics(candidate_uuid UUID, job_uuid UUID)
RETURNS VOID AS $$
DECLARE
    candidate_record RECORD;
    response_record RECORD;
    total_candidates_in_job INTEGER;
    candidate_rank INTEGER;
    total_responses INTEGER;
    total_time INTEGER;
    avg_response_time DECIMAL(10,2);
    completion_pct DECIMAL(5,2);
    overall_score DECIMAL(5,2);
    resume_score DECIMAL(5,2);
    interview_score DECIMAL(5,2);
    ai_score DECIMAL(5,2);
    engagement_level VARCHAR(20);
    time_spent_minutes INTEGER;
BEGIN
    -- Get candidate data
    SELECT * INTO candidate_record 
    FROM candidates 
    WHERE id = candidate_uuid AND job_id = job_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate response analytics
    SELECT 
        COUNT(*),
        0, -- No updated_at, so set avg response time to 0
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM job_questions WHERE job_id = job_uuid)
    INTO total_responses, avg_response_time, completion_pct
    FROM responses 
    WHERE candidate_id = candidate_uuid;
    
    -- Calculate scores
    SELECT 
        COALESCE(evaluation.score, 0),
        COALESCE(evaluation.resume_score, 0),
        COALESCE(evaluation.interview_score, 0),
        COALESCE(ai_evaluation.overall_score, 0)
    INTO overall_score, resume_score, interview_score, ai_score
    FROM candidates c
    LEFT JOIN evaluations evaluation ON c.id = evaluation.candidate_id
    LEFT JOIN ai_evaluations ai_evaluation ON c.id = ai_evaluation.candidate_id
    WHERE c.id = candidate_uuid;
    
    -- Calculate engagement level
    SELECT 
        0 -- No updated_at, so set time_spent_minutes to 0
    INTO time_spent_minutes
    FROM responses 
    WHERE candidate_id = candidate_uuid;
    
    engagement_level := CASE 
        WHEN time_spent_minutes > 30 THEN 'high'
        WHEN time_spent_minutes > 15 THEN 'medium'
        ELSE 'low'
    END;
    
    -- Calculate rank and percentile
    SELECT COUNT(*) INTO total_candidates_in_job
    FROM candidates 
    WHERE job_id = job_uuid;
    
    SELECT COUNT(*) + 1 INTO candidate_rank
    FROM candidates c
    LEFT JOIN evaluations e ON c.id = e.candidate_id
    WHERE c.job_id = job_uuid 
    AND COALESCE(e.score, 0) > overall_score;
    
    -- Insert or update analytics
    INSERT INTO candidate_analytics (
        candidate_id, job_id, total_responses, average_response_time_seconds,
        completion_percentage, questions_answered, total_questions,
        overall_score, resume_score, interview_score, ai_score,
        time_spent_minutes, engagement_level, rank_in_job, total_candidates_in_job,
        percentile_rank
    ) VALUES (
        candidate_uuid, job_uuid, total_responses, avg_response_time,
        completion_pct, total_responses, (SELECT COUNT(*) FROM job_questions WHERE job_id = job_uuid),
        overall_score, resume_score, interview_score, ai_score,
        time_spent_minutes, engagement_level, candidate_rank, total_candidates_in_job,
        CASE WHEN total_candidates_in_job > 0 THEN 
            ROUND((candidate_rank::DECIMAL / total_candidates_in_job) * 100)
        ELSE 0 END
    )
    ON CONFLICT (candidate_id, job_id) 
    DO UPDATE SET
        total_responses = EXCLUDED.total_responses,
        average_response_time_seconds = EXCLUDED.average_response_time_seconds,
        completion_percentage = EXCLUDED.completion_percentage,
        questions_answered = EXCLUDED.questions_answered,
        total_questions = EXCLUDED.total_questions,
        overall_score = EXCLUDED.overall_score,
        resume_score = EXCLUDED.resume_score,
        interview_score = EXCLUDED.interview_score,
        ai_score = EXCLUDED.ai_score,
        time_spent_minutes = EXCLUDED.time_spent_minutes,
        engagement_level = EXCLUDED.engagement_level,
        rank_in_job = EXCLUDED.rank_in_job,
        total_candidates_in_job = EXCLUDED.total_candidates_in_job,
        percentile_rank = EXCLUDED.percentile_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate response analytics
CREATE OR REPLACE FUNCTION calculate_response_analytics(response_uuid UUID)
RETURNS VOID AS $$
DECLARE
    response_record RECORD;
    candidate_uuid UUID;
    word_count INTEGER;
    response_time INTEGER;
    quality_score DECIMAL(5,2);
BEGIN
    -- Get response data
    SELECT r.*, c.id as candidate_id INTO response_record
    FROM responses r
    JOIN candidates c ON r.candidate_id = c.id
    WHERE r.id = response_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    candidate_uuid := response_record.candidate_id;
    
    -- Calculate basic metrics
    word_count := array_length(string_to_array(response_record.response, ' '), 1);
    response_time := 0; -- No updated_at, so set to 0
    
    -- Simple quality score based on response length and time
    quality_score := CASE 
        WHEN word_count > 100 AND response_time > 60 THEN 90
        WHEN word_count > 50 AND response_time > 30 THEN 75
        WHEN word_count > 25 AND response_time > 15 THEN 60
        ELSE 40
    END;
    
    -- Insert or update response analytics
    INSERT INTO candidate_response_analytics (
        candidate_id, response_id, response_length_words, response_time_seconds,
        response_quality_score
    ) VALUES (
        candidate_uuid, response_uuid, word_count, response_time, quality_score
    )
    ON CONFLICT (candidate_id, response_id) 
    DO UPDATE SET
        response_length_words = EXCLUDED.response_length_words,
        response_time_seconds = EXCLUDED.response_time_seconds,
        response_quality_score = EXCLUDED.response_quality_score;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update analytics
CREATE OR REPLACE FUNCTION trigger_candidate_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update candidate analytics when responses change
    IF TG_TABLE_NAME = 'responses' THEN
        PERFORM calculate_candidate_analytics(NEW.candidate_id, 
            (SELECT job_id FROM candidates WHERE id = NEW.candidate_id));
        PERFORM calculate_response_analytics(NEW.id);
    END IF;
    
    -- Update candidate analytics when evaluations change
    IF TG_TABLE_NAME = 'evaluations' THEN
        PERFORM calculate_candidate_analytics(NEW.candidate_id, 
            (SELECT job_id FROM candidates WHERE id = NEW.candidate_id));
    END IF;
    
    -- Update candidate analytics when AI evaluations change
    IF TG_TABLE_NAME = 'ai_evaluations' THEN
        PERFORM calculate_candidate_analytics(NEW.candidate_id, 
            (SELECT job_id FROM candidates WHERE id = NEW.candidate_id));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_candidate_analytics_responses ON responses;
CREATE TRIGGER trigger_candidate_analytics_responses
    AFTER INSERT OR UPDATE ON responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_candidate_analytics_update();

DROP TRIGGER IF EXISTS trigger_candidate_analytics_evaluations ON evaluations;
CREATE TRIGGER trigger_candidate_analytics_evaluations
    AFTER INSERT OR UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_candidate_analytics_update();

DROP TRIGGER IF EXISTS trigger_candidate_analytics_ai_evaluations ON ai_evaluations;
CREATE TRIGGER trigger_candidate_analytics_ai_evaluations
    AFTER INSERT OR UPDATE ON ai_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_candidate_analytics_update();

-- Function to get comprehensive candidate analytics
CREATE OR REPLACE FUNCTION get_candidate_analytics(candidate_uuid UUID, job_uuid UUID)
RETURNS TABLE (
    analytics JSON,
    response_analytics JSON,
    comparative_data JSON
) AS $$
DECLARE
    analytics_record RECORD;
    response_analytics_array JSON;
    comparative_data_record RECORD;
BEGIN
    -- Get main analytics
    SELECT * INTO analytics_record
    FROM candidate_analytics
    WHERE candidate_id = candidate_uuid AND job_id = job_uuid;
    
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
    JOIN responses r ON ra.response_id = r.id
    WHERE ra.candidate_id = candidate_uuid AND r.job_id = job_uuid;
    
    -- Get comparative data
    SELECT 
        json_build_object(
            'total_candidates', COUNT(*),
            'average_score', AVG(COALESCE(overall_score, 0)),
            'top_percentile', PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY COALESCE(overall_score, 0)),
            'median_score', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(overall_score, 0)),
            'completion_rate', AVG(completion_percentage),
            'average_time_spent', AVG(time_spent_minutes)
        ) INTO comparative_data_record
    FROM candidate_analytics
    WHERE job_id = job_uuid;
    
    RETURN QUERY SELECT
        to_json(analytics_record) as analytics,
        COALESCE(response_analytics_array, '[]'::json) as response_analytics,
        to_json(comparative_data_record) as comparative_data;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE candidate_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_response_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for candidate_analytics
CREATE POLICY "Users can view candidate analytics for their jobs" ON candidate_analytics
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs WHERE profile_id = auth.uid()
        )
    );

-- Policy for candidate_response_analytics
CREATE POLICY "Users can view response analytics for their jobs" ON candidate_response_analytics
    FOR SELECT USING (
        candidate_id IN (
            SELECT c.id FROM candidates c
            JOIN jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        )
    ); 