-- Fix the calculate_candidate_analytics function to properly separate resume_score and interview_score
-- The issue is that both scores were being set to evaluation_score instead of using distinct values
-- This fixes the mismatch between Interview Score and Resume Match in the UI

CREATE OR REPLACE FUNCTION public.calculate_candidate_analytics(candidate_uuid uuid, job_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    candidate_record RECORD;
    total_candidates_in_job INTEGER;
    candidate_rank INTEGER;
    total_responses INTEGER;
    total_time_seconds INTEGER;
    avg_response_time DECIMAL(10,2);
    completion_pct DECIMAL(5,2);
    calculated_overall_score DECIMAL(5,2);
    evaluation_score DECIMAL(5,2);
    resume_evaluation_score DECIMAL(5,2);  -- NEW: separate resume score
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
    
    -- Calculate simple truthiness score based on response time only
    SELECT 
        COALESCE(AVG(
            CASE 
                WHEN r.response_time IS NULL THEN 50
                WHEN r.response_time <= 0 THEN 0
                WHEN r.response_time < 5 THEN 0  -- Too fast (less than 5 seconds)
                WHEN r.response_time < 15 THEN 25  -- Very fast
                WHEN r.response_time < 30 THEN 50  -- Fast
                WHEN r.response_time <= 300 THEN 100  -- Good range (up to 5 minutes)
                WHEN r.response_time <= 600 THEN 75  -- Slow but acceptable
                WHEN r.response_time <= 900 THEN 50  -- Very slow
                ELSE 25  -- Extremely slow
            END
        ), 50)::DECIMAL(5,2)
    INTO truthiness_score
    FROM responses r
    WHERE r.candidate_id = candidate_uuid;
    
    -- FIXED: Get both interview score (evaluation.score) and resume score (evaluation.resume_score) separately
    SELECT 
        COALESCE(evaluation.score, 0)::DECIMAL(5,2),
        COALESCE(evaluation.resume_score, 0)::DECIMAL(5,2)
    INTO evaluation_score, resume_evaluation_score
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
    calculated_overall_score := CASE 
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
    AND ((COALESCE(e.score, 0) + COALESCE(ae.overall_score, 0))/2) > calculated_overall_score;
    
    -- FIXED: Insert or update analytics with proper score separation
    INSERT INTO candidate_analytics (
        candidate_id, job_id, total_responses, average_response_time_seconds,
        completion_percentage, questions_answered, total_questions,
        overall_score, resume_score, interview_score, ai_score,
        time_spent_minutes, engagement_level, rank_in_job, total_candidates_in_job,
        percentile_rank, response_quality_score, last_activity_at
    ) VALUES (
        candidate_uuid, job_uuid, total_responses, avg_response_time,
        completion_pct, total_responses, total_questions,
        calculated_overall_score, 
        resume_evaluation_score,  -- FIXED: Use separate resume score
        evaluation_score,         -- FIXED: Interview score is the main evaluation score
        ai_score,
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
$function$;

-- Recalculate analytics for all existing candidates to fix the score mismatch
DO $$
DECLARE
    candidate_record RECORD;
BEGIN
    FOR candidate_record IN 
        SELECT c.id, c.job_id 
        FROM candidates c 
        WHERE c.is_completed = true
    LOOP
        PERFORM calculate_candidate_analytics(candidate_record.id, candidate_record.job_id);
    END LOOP;
    
    RAISE NOTICE '✅ Fixed candidate analytics score calculation';
    RAISE NOTICE '  - Updated function to properly separate resume_score and interview_score';
    RAISE NOTICE '  - Recalculated analytics for all completed candidates';
END $$;
