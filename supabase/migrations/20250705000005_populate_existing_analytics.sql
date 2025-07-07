-- Migration: Populate analytics for existing data
-- This migration calculates analytics for all existing candidates and responses

-- First, recreate the calculate_candidate_analytics function without updated_at references
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
    
    -- Calculate truthiness score based on response time patterns
    -- Since we don't have expected_duration, we'll use reasonable time ranges
    SELECT 
        COALESCE(AVG(
            CASE 
                WHEN r.response_time IS NULL THEN 50 -- No response time recorded, neutral
                WHEN r.response_time <= 0 THEN 0 -- No time recorded, suspicious
                WHEN r.response_time < 5 THEN 0 -- Too fast, suspicious (less than 5 seconds)
                WHEN r.response_time < 15 THEN 25 -- Very fast, concerning
                WHEN r.response_time < 30 THEN 50 -- Fast, neutral
                WHEN r.response_time <= 300 THEN 100 -- Good range (up to 5 minutes)
                WHEN r.response_time <= 600 THEN 75 -- Slow but acceptable (up to 10 minutes)
                WHEN r.response_time <= 900 THEN 50 -- Very slow (up to 15 minutes)
                ELSE 25 -- Extremely slow, concerning
            END
        ), 50) -- Default to neutral if no responses
    INTO truthiness_score
    FROM responses r
    WHERE r.candidate_id = candidate_uuid;
    
    -- Calculate scores
    SELECT 
        COALESCE(evaluation.score, 0),
        COALESCE(ai_evaluation.overall_score, 0)
    INTO evaluation_score, ai_score
    FROM candidates c
    LEFT JOIN evaluations evaluation ON c.id = evaluation.candidate_id
    LEFT JOIN ai_evaluations ai_evaluation ON c.id = ai_evaluation.candidate_id
    WHERE c.id = candidate_uuid;
    
    -- Set overall score to evaluation score (or average if we have both)
    overall_score := CASE 
        WHEN evaluation_score > 0 AND ai_score > 0 THEN (evaluation_score + ai_score) / 2
        WHEN evaluation_score > 0 THEN evaluation_score
        WHEN ai_score > 0 THEN ai_score
        ELSE 0
    END;
    
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
        overall_score, evaluation_score, evaluation_score, ai_score, -- Use evaluation_score for both resume and interview
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

-- Also recreate the calculate_response_analytics function without updated_at references
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
BEGIN
    -- Get response data
    SELECT r.*, c.id as candidate_id
    INTO response_record
    FROM responses r
    JOIN candidates c ON r.candidate_id = c.id
    WHERE r.id = response_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    candidate_uuid := response_record.candidate_id;
    
    -- Calculate basic metrics
    word_count := array_length(string_to_array(response_record.answer, ' '), 1);
    response_time_seconds := COALESCE(response_record.response_time, 0);
    
    -- Calculate truthiness score based on response time patterns
    -- Since we don't have expected_duration, we'll use reasonable time ranges
    truthiness_score := CASE 
        WHEN response_time_seconds <= 0 THEN 0 -- No time recorded, suspicious
        WHEN response_time_seconds < 5 THEN 0 -- Too fast, suspicious (less than 5 seconds)
        WHEN response_time_seconds < 15 THEN 25 -- Very fast, concerning
        WHEN response_time_seconds < 30 THEN 50 -- Fast, neutral
        WHEN response_time_seconds <= 300 THEN 100 -- Good range (up to 5 minutes)
        WHEN response_time_seconds <= 600 THEN 75 -- Slow but acceptable (up to 10 minutes)
        WHEN response_time_seconds <= 900 THEN 50 -- Very slow (up to 15 minutes)
        ELSE 25 -- Extremely slow, concerning
    END;
    
    -- Scale truthiness score to fit in DECIMAL(3,2) range (-9.99 to 9.99)
    -- Convert 0-100 scale to -9.99 to 9.99 scale
    scaled_sentiment := CASE 
        WHEN truthiness_score = 0 THEN -9.99
        WHEN truthiness_score <= 25 THEN -5.00
        WHEN truthiness_score <= 50 THEN 0.00
        WHEN truthiness_score <= 75 THEN 5.00
        WHEN truthiness_score <= 100 THEN 9.99
        ELSE 0.00
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

-- Now populate candidate analytics for existing candidates
DO $$
DECLARE
    candidate_record RECORD;
BEGIN
    -- Loop through all candidates
    FOR candidate_record IN 
        SELECT DISTINCT c.id as candidate_id, c.job_id
        FROM candidates c
        LEFT JOIN candidate_analytics ca ON c.id = ca.candidate_id
        WHERE ca.id IS NULL
    LOOP
        -- Calculate analytics for each candidate
        PERFORM calculate_candidate_analytics(candidate_record.candidate_id, candidate_record.job_id);
    END LOOP;
    
    -- Loop through all responses
    FOR candidate_record IN 
        SELECT DISTINCT r.id as response_id
        FROM responses r
        LEFT JOIN candidate_response_analytics cra ON r.id = cra.response_id
        WHERE cra.id IS NULL
    LOOP
        -- Calculate response analytics for each response
        PERFORM calculate_response_analytics(candidate_record.response_id);
    END LOOP;
END $$; 