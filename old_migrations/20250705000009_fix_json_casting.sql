-- Migration: Fix JSON casting issue in get_candidate_analytics function
-- The issue is that to_json(analytics_record) tries to cast a RECORD to JSON, which PostgreSQL doesn't allow

-- Fix the get_candidate_analytics function to properly handle JSON conversion
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
        -- Convert record to JSON properly using json_build_object
        default_analytics := json_build_object(
            'id', analytics_record.id,
            'candidate_id', analytics_record.candidate_id,
            'job_id', analytics_record.job_id,
            'total_responses', analytics_record.total_responses,
            'average_response_time_seconds', analytics_record.average_response_time_seconds,
            'completion_percentage', analytics_record.completion_percentage,
            'questions_answered', analytics_record.questions_answered,
            'total_questions', analytics_record.total_questions,
            'overall_score', analytics_record.overall_score,
            'resume_score', analytics_record.resume_score,
            'interview_score', analytics_record.interview_score,
            'ai_score', analytics_record.ai_score,
            'response_quality_score', analytics_record.response_quality_score,
            'communication_score', analytics_record.communication_score,
            'technical_score', analytics_record.technical_score,
            'problem_solving_score', analytics_record.problem_solving_score,
            'time_spent_minutes', analytics_record.time_spent_minutes,
            'last_activity_at', analytics_record.last_activity_at,
            'engagement_level', analytics_record.engagement_level,
            'percentile_rank', analytics_record.percentile_rank,
            'rank_in_job', analytics_record.rank_in_job,
            'total_candidates_in_job', analytics_record.total_candidates_in_job,
            'ai_recommendation', analytics_record.ai_recommendation,
            'confidence_score', analytics_record.confidence_score,
            'strengths_summary', analytics_record.strengths_summary,
            'areas_for_improvement', analytics_record.areas_for_improvement,
            'red_flags', analytics_record.red_flags,
            'created_at', analytics_record.created_at,
            'updated_at', analytics_record.updated_at
        );
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