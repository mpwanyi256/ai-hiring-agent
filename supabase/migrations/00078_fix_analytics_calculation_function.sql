-- Migration: Fix analytics calculation function for proper type handling
-- This fixes the type casting issue in the calculation function

-- Fix the calculate_candidate_analytics function to handle type casting properly
CREATE OR REPLACE FUNCTION calculate_candidate_analytics(candidate_uuid UUID, job_uuid UUID)
RETURNS VOID AS $$
DECLARE
    candidate_record RECORD;
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
    
    -- Calculate response analytics
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(AVG(r.response_time), 0)::DECIMAL(10,2),
        CASE WHEN total_questions > 0 THEN 
            (COUNT(*)::DECIMAL * 100.0 / total_questions::DECIMAL)
        ELSE 0 END,
        COALESCE(SUM(r.response_time), 0)::INTEGER
    INTO total_responses, avg_response_time, completion_pct, time_spent_seconds
    FROM responses r
    WHERE r.candidate_id = candidate_uuid;
    
    -- Calculate truthiness score based on response time vs expected_duration from job_questions
    SELECT 
        COALESCE(AVG(
            CASE 
                WHEN jq.expected_duration IS NULL THEN 50
                WHEN r.response_time IS NULL THEN 50
                WHEN r.response_time <= 0 THEN 0
                WHEN r.response_time < jq.expected_duration * 0.1 THEN 0
                WHEN r.response_time < jq.expected_duration * 0.3 THEN 25
                WHEN r.response_time < jq.expected_duration * 0.5 THEN 50
                WHEN r.response_time <= jq.expected_duration * 1.5 THEN 100
                WHEN r.response_time <= jq.expected_duration * 2.0 THEN 75
                WHEN r.response_time <= jq.expected_duration * 3.0 THEN 50
                ELSE 25
            END
        ), 50)::DECIMAL(5,2)
    INTO truthiness_score
    FROM responses r
    LEFT JOIN job_questions jq ON r.question_id = jq.id
    WHERE r.candidate_id = candidate_uuid;
    
    -- Calculate scores - get evaluation score
    SELECT 
        COALESCE(evaluation.score, 0)::DECIMAL(5,2)
    INTO evaluation_score
    FROM candidates c
    LEFT JOIN evaluations evaluation ON c.id = evaluation.candidate_id
    WHERE c.id = candidate_uuid;
    
    -- Get AI score from ai_evaluations table
    SELECT 
        COALESCE(ae.overall_score, 0)::DECIMAL(5,2)
    INTO ai_score
    FROM candidates c
    LEFT JOIN ai_evaluations ae ON c.id = ae.candidate_id AND c.job_id = ae.job_id
    WHERE c.id = candidate_uuid;
    
    -- Calculate overall score (combine evaluation and AI scores)
    overall_score := CASE 
        WHEN evaluation_score > 0 AND ai_score > 0 THEN (evaluation_score + ai_score) / 2
        WHEN evaluation_score > 0 THEN evaluation_score
        WHEN ai_score > 0 THEN ai_score
        ELSE 0
    END;
    
    -- Calculate engagement level based on time spent in seconds
    engagement_level := CASE 
        WHEN time_spent_seconds > 1800 THEN 'high'
        WHEN time_spent_seconds > 900 THEN 'medium'
        ELSE 'low'
    END;
    
    -- Calculate rank and percentile
    SELECT COUNT(*)::INTEGER INTO total_candidates_in_job
    FROM candidates 
    WHERE job_id = job_uuid;
    
    SELECT (COUNT(*) + 1)::INTEGER INTO candidate_rank
    FROM candidates c
    LEFT JOIN evaluations e ON c.id = e.candidate_id
    LEFT JOIN ai_evaluations ae ON c.id = ae.candidate_id AND c.job_id = ae.job_id
    WHERE c.job_id = job_uuid 
    AND ((COALESCE(e.score, 0) + COALESCE(ae.overall_score, 0))/2) > overall_score;
    
    -- Insert or update analytics
    INSERT INTO candidate_analytics (
        candidate_id, job_id, total_responses, average_response_time_seconds,
        completion_percentage, questions_answered, total_questions,
        overall_score, resume_score, interview_score, ai_score,
        time_spent_minutes, engagement_level, rank_in_job, total_candidates_in_job,
        percentile_rank, response_quality_score, last_activity_at
    ) VALUES (
        candidate_uuid, job_uuid, total_responses, avg_response_time,
        completion_pct, total_responses, total_questions,
        overall_score, evaluation_score, evaluation_score, ai_score,
        ROUND(time_spent_seconds / 60.0, 2),
        engagement_level, candidate_rank, total_candidates_in_job,
        CASE WHEN total_candidates_in_job > 0 THEN 
            ROUND((candidate_rank::DECIMAL / total_candidates_in_job) * 100)
        ELSE 0 END,
        truthiness_score,
        NOW()
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
        response_quality_score = EXCLUDED.response_quality_score,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Fix the calculate_response_analytics function to handle type casting properly
CREATE OR REPLACE FUNCTION calculate_response_analytics(response_uuid UUID)
RETURNS VOID AS $$
DECLARE
    response_record RECORD;
    candidate_uuid UUID;
    word_count INTEGER;
    response_time_seconds INTEGER;
    quality_score DECIMAL(5,2);
    truthiness_score DECIMAL(5,2);
    scaled_sentiment DECIMAL(5,2);
    expected_duration INTEGER;
BEGIN
    -- Get response data with question details
    SELECT r.*, c.id as candidate_id, jq.expected_duration
    INTO response_record
    FROM responses r
    JOIN candidates c ON r.candidate_id = c.id
    LEFT JOIN job_questions jq ON r.question_id = jq.id
    WHERE r.id = response_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    candidate_uuid := response_record.candidate_id;
    expected_duration := response_record.expected_duration;
    
    -- Calculate basic metrics
    word_count := CASE 
        WHEN response_record.answer IS NOT NULL THEN
            array_length(string_to_array(response_record.answer, ' '), 1)
        ELSE 0
    END;
    response_time_seconds := COALESCE(response_record.response_time, 0);
    
    -- Calculate truthiness score based on response time vs expected_duration
    truthiness_score := CASE 
        WHEN expected_duration IS NULL THEN 50
        WHEN response_time_seconds <= 0 THEN 0
        WHEN response_time_seconds < expected_duration * 0.1 THEN 0
        WHEN response_time_seconds < expected_duration * 0.3 THEN 25
        WHEN response_time_seconds < expected_duration * 0.5 THEN 50
        WHEN response_time_seconds <= expected_duration * 1.5 THEN 100
        WHEN response_time_seconds <= expected_duration * 2.0 THEN 75
        WHEN response_time_seconds <= expected_duration * 3.0 THEN 50
        ELSE 25
    END;
    
    -- Scale sentiment score to fit in DECIMAL(5,2) range
    scaled_sentiment := CASE 
        WHEN truthiness_score = 0 THEN 0.00
        WHEN truthiness_score <= 25 THEN 25.00
        WHEN truthiness_score <= 50 THEN 50.00
        WHEN truthiness_score <= 75 THEN 75.00
        WHEN truthiness_score <= 100 THEN 100.00
        ELSE 50.00
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
        sentiment_score = EXCLUDED.sentiment_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql; 