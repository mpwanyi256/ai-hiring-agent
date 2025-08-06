-- Migration: Fix return type of comparative_data in get_candidate_analytics
CREATE OR REPLACE FUNCTION get_candidate_analytics(candidate_uuid UUID, job_uuid UUID)
RETURNS TABLE (
    analytics JSON,
    response_analytics JSON,
    comparative_data JSON
) AS $$
DECLARE
    analytics_record RECORD;
    response_analytics_array JSON;
    comparative_data_json JSON;
    default_analytics JSON;
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
    JOIN responses r ON ra.response_id = r.id
    WHERE ra.candidate_id = candidate_uuid AND r.job_id = job_uuid;
    
    -- Get comparative data with proper structure (not nested) - store directly as JSON
    SELECT 
        json_build_object(
            'total_candidates', COALESCE(COUNT(*), 0),
            'average_score', COALESCE(AVG(COALESCE(overall_score, 0)), 0),
            'top_percentile', COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY COALESCE(overall_score, 0)), 0),
            'median_score', COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(overall_score, 0)), 0),
            'completion_rate', COALESCE(AVG(completion_percentage), 0),
            'average_time_spent', COALESCE(AVG(time_spent_minutes), 0)
        ) INTO comparative_data_json
    FROM candidate_analytics
    WHERE job_id = job_uuid;
    
    -- If no comparative data exists, create default
    IF comparative_data_json IS NULL THEN
        comparative_data_json := json_build_object(
            'total_candidates', 0,
            'average_score', 0,
            'top_percentile', 0,
            'median_score', 0,
            'completion_rate', 0,
            'average_time_spent', 0
        );
    END IF;
    
    RETURN QUERY SELECT
        default_analytics as analytics,
        COALESCE(response_analytics_array, '[]'::json) as response_analytics,
        comparative_data_json as comparative_data;
END;
$$ LANGUAGE plpgsql;

-- Fix the calculate_candidate_analytics function to use expected_duration for truthiness
CREATE OR REPLACE FUNCTION calculate_candidate_analytics(candidate_uuid UUID, job_uuid UUID)
RETURNS VOID AS $$
DECLARE
    candidate_record RECORD;
    response_record RECORD;
    total_candidates_in_job INTEGER;
    candidate_rank INTEGER;
    total_responses INTEGER;
    total_time_seconds INTEGER;
    avg_response_time DECIMAL(10,2);
    completion_pct DECIMAL(5,2);
    overall_score DECIMAL(5,2);
    evaluation_score DECIMAL(5,2);
    ai_score DECIMAL(5,2);
    engagement_level VARCHAR(20);
    time_spent_seconds INTEGER;
    truthiness_score DECIMAL(5,2);
    total_questions INTEGER;
BEGIN
    -- Get candidate data
    SELECT * INTO candidate_record 
    FROM candidates 
    WHERE id = candidate_uuid AND job_id = job_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get total questions for this job
    SELECT COUNT(*) INTO total_questions
    FROM job_questions 
    WHERE job_id = job_uuid;
    
    -- Avoid division by zero
    IF total_questions = 0 THEN
        total_questions := 1;
    END IF;
    
    -- Calculate response analytics with truthiness scoring
    SELECT 
        COUNT(*),
        COALESCE(AVG(r.response_time), 0), -- Use actual response_time from responses table
        CASE WHEN total_questions > 0 THEN 
            (COUNT(*) * 100.0 / total_questions)
        ELSE 0 END,
        COALESCE(SUM(r.response_time), 0) -- Total time spent in seconds
    INTO total_responses, avg_response_time, completion_pct, time_spent_seconds
    FROM responses r
    WHERE r.candidate_id = candidate_uuid;
    
    -- Calculate truthiness score based on response time vs expected_duration from job_questions
    SELECT 
        COALESCE(AVG(
            CASE 
                WHEN jq.expected_duration IS NULL THEN 50 -- No expected duration, assume neutral
                WHEN r.response_time IS NULL THEN 50 -- No response time recorded, neutral
                WHEN r.response_time <= 0 THEN 0 -- No time recorded, suspicious
                WHEN r.response_time < jq.expected_duration * 0.1 THEN 0 -- Too fast, suspicious (< 10% of expected)
                WHEN r.response_time < jq.expected_duration * 0.3 THEN 25 -- Very fast, concerning (< 30% of expected)
                WHEN r.response_time < jq.expected_duration * 0.5 THEN 50 -- Fast, neutral (< 50% of expected)
                WHEN r.response_time <= jq.expected_duration * 1.5 THEN 100 -- Good range (50% - 150% of expected)
                WHEN r.response_time <= jq.expected_duration * 2.0 THEN 75 -- Slow but acceptable (150% - 200% of expected)
                WHEN r.response_time <= jq.expected_duration * 3.0 THEN 50 -- Very slow (200% - 300% of expected)
                ELSE 25 -- Extremely slow, concerning (> 300% of expected)
            END
        ), 50) -- Default to neutral if no responses
    INTO truthiness_score
    FROM responses r
    JOIN job_questions jq ON r.question_id = jq.id
    WHERE r.candidate_id = candidate_uuid;
    
    -- Calculate scores - only get evaluation score, leave ai_score as null
    SELECT 
        COALESCE(evaluation.score, 0)
    INTO evaluation_score
    FROM candidates c
    LEFT JOIN evaluations evaluation ON c.id = evaluation.candidate_id
    WHERE c.id = candidate_uuid;
    
    -- Set ai_score to null since we don't have AI evaluations yet
    ai_score := null;
    
    -- Set overall score to evaluation score only
    overall_score := evaluation_score;
    
    -- Calculate engagement level based on time spent in seconds
    engagement_level := CASE 
        WHEN time_spent_seconds > 1800 THEN 'high' -- More than 30 minutes
        WHEN time_spent_seconds > 900 THEN 'medium' -- More than 15 minutes
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
        percentile_rank, response_quality_score
    ) VALUES (
        candidate_uuid, job_uuid, total_responses, avg_response_time,
        completion_pct, total_responses, total_questions,
        overall_score, evaluation_score, evaluation_score, ai_score, -- Use evaluation_score for both resume and interview, null for ai_score
        ROUND(time_spent_seconds / 60.0, 2), -- Convert seconds to minutes
        engagement_level, candidate_rank, total_candidates_in_job,
        CASE WHEN total_candidates_in_job > 0 THEN 
            ROUND((candidate_rank::DECIMAL / total_candidates_in_job) * 100)
        ELSE 0 END,
        truthiness_score
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
        percentile_rank = EXCLUDED.percentile_rank,
        response_quality_score = EXCLUDED.response_quality_score;
END;
$$ LANGUAGE plpgsql;

-- Fix the calculate_response_analytics function to use expected_duration for truthiness
CREATE OR REPLACE FUNCTION calculate_response_analytics(response_uuid UUID)
RETURNS VOID AS $$
DECLARE
    response_record RECORD;
    candidate_uuid UUID;
    word_count INTEGER;
    response_time_seconds INTEGER;
    quality_score DECIMAL(5,2);
    truthiness_score DECIMAL(5,2);
    scaled_sentiment DECIMAL(3,2);
    expected_duration INTEGER;
BEGIN
    -- Get response data with question details
    SELECT r.*, c.id as candidate_id, jq.expected_duration
    INTO response_record
    FROM responses r
    JOIN candidates c ON r.candidate_id = c.id
    JOIN job_questions jq ON r.question_id = jq.id
    WHERE r.id = response_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    candidate_uuid := response_record.candidate_id;
    expected_duration := response_record.expected_duration;
    
    -- Calculate basic metrics
    word_count := array_length(string_to_array(response_record.answer, ' '), 1);
    response_time_seconds := COALESCE(response_record.response_time, 0);
    
    -- Calculate truthiness score based on response time vs expected_duration
    truthiness_score := CASE 
        WHEN expected_duration IS NULL THEN 50 -- No expected duration, assume neutral
        WHEN response_time_seconds <= 0 THEN 0 -- No time recorded, suspicious
        WHEN response_time_seconds < expected_duration * 0.1 THEN 0 -- Too fast, suspicious (< 10% of expected)
        WHEN response_time_seconds < expected_duration * 0.3 THEN 25 -- Very fast, concerning (< 30% of expected)
        WHEN response_time_seconds < expected_duration * 0.5 THEN 50 -- Fast, neutral (< 50% of expected)
        WHEN response_time_seconds <= expected_duration * 1.5 THEN 100 -- Good range (50% - 150% of expected)
        WHEN response_time_seconds <= expected_duration * 2.0 THEN 75 -- Slow but acceptable (150% - 200% of expected)
        WHEN response_time_seconds <= expected_duration * 3.0 THEN 50 -- Very slow (200% - 300% of expected)
        ELSE 25 -- Extremely slow, concerning (> 300% of expected)
    END;
    
    -- Scale truthiness score to fit in DECIMAL(3,2) range (0.00 to 9.99) - use positive values only
    scaled_sentiment := CASE 
        WHEN truthiness_score = 0 THEN 0.00
        WHEN truthiness_score <= 25 THEN 2.50
        WHEN truthiness_score <= 50 THEN 5.00
        WHEN truthiness_score <= 75 THEN 7.50
        WHEN truthiness_score <= 100 THEN 9.99
        ELSE 5.00
    END;
    
    -- Simple quality score based on response length and truthiness
    quality_score := CASE 
        WHEN word_count > 100 AND truthiness_score > 75 THEN 90
        WHEN word_count > 50 AND truthiness_score > 50 THEN 75
        WHEN word_count > 25 AND truthiness_score > 25 THEN 60
        ELSE 40
    END;
    
    -- Insert or update response analytics
    INSERT INTO candidate_response_analytics (
        candidate_id, response_id, response_length_words, response_time_seconds,
        response_quality_score, sentiment_score
    ) VALUES (
        candidate_uuid, response_uuid, word_count, response_time_seconds, 
        quality_score, scaled_sentiment
    )
    ON CONFLICT (candidate_id, response_id) 
    DO UPDATE SET
        response_length_words = EXCLUDED.response_length_words,
        response_time_seconds = EXCLUDED.response_time_seconds,
        response_quality_score = EXCLUDED.response_quality_score,
        sentiment_score = EXCLUDED.sentiment_score;
END;
$$ LANGUAGE plpgsql;

-- Update existing analytics to fix the issues
DO $$
DECLARE
    candidate_record RECORD;
BEGIN
    -- Loop through all candidates to recalculate analytics with fixes
    FOR candidate_record IN 
        SELECT DISTINCT c.id as candidate_id, c.job_id
        FROM candidates c
    LOOP
        -- Recalculate analytics for each candidate
        PERFORM calculate_candidate_analytics(candidate_record.candidate_id, candidate_record.job_id);
    END LOOP;
    
    -- Loop through all responses to recalculate response analytics with fixes
    FOR candidate_record IN 
        SELECT DISTINCT r.id as response_id
        FROM responses r
    LOOP
        -- Recalculate response analytics for each response
        PERFORM calculate_response_analytics(candidate_record.response_id);
    END LOOP;
END $$; 