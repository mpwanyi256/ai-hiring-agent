-- Create a comprehensive questions view with job details and counts
CREATE OR REPLACE VIEW job_questions_overview AS
SELECT 
    j.id as job_id,
    j.profile_id,
    j.title as job_title,
    j.fields as job_fields,
    j.interview_format,
    j.interview_token,
    j.is_active,
    j.status,
    j.created_at as job_created_at,
    j.updated_at as job_updated_at,
    
    -- Questions stats
    COALESCE(qs.total_questions, 0) as total_questions,
    COALESCE(qs.required_questions, 0) as required_questions,
    COALESCE(qs.optional_questions, 0) as optional_questions,
    COALESCE(qs.ai_generated_questions, 0) as ai_generated_questions,
    COALESCE(qs.estimated_duration, 0) as estimated_duration,
    
    -- Candidates stats (from responses table - interview architecture)
    COALESCE(cs.total_candidates, 0) as total_candidates,
    COALESCE(cs.completed_interviews, 0) as completed_interviews,
    COALESCE(cs.in_progress_interviews, 0) as in_progress_interviews,
    
    -- Evaluations stats
    COALESCE(es.total_evaluations, 0) as total_evaluations,
    COALESCE(es.resume_evaluations, 0) as resume_evaluations,
    COALESCE(es.interview_evaluations, 0) as interview_evaluations,
    COALESCE(es.combined_evaluations, 0) as combined_evaluations,
    COALESCE(es.avg_score, 0) as avg_evaluation_score,
    COALESCE(es.recommended_candidates, 0) as recommended_candidates

FROM jobs j

-- Questions aggregation
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as total_questions,
        COUNT(*) FILTER (WHERE is_required = true) as required_questions,
        COUNT(*) FILTER (WHERE is_required = false) as optional_questions,
        COUNT(*) FILTER (WHERE is_ai_generated = true) as ai_generated_questions,
        SUM(expected_duration) as estimated_duration
    FROM job_questions
    GROUP BY job_id
) qs ON j.id = qs.job_id

-- Candidates aggregation (using responses table for interview architecture)
LEFT JOIN (
    SELECT 
        r.job_id,
        COUNT(DISTINCT r.profile_id) as total_candidates,
        COUNT(DISTINCT r.profile_id) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM responses r2 
                WHERE r2.profile_id = r.profile_id 
                AND r2.job_id = r.job_id
                HAVING COUNT(*) >= (
                    SELECT COUNT(*) FROM job_questions jq 
                    WHERE jq.job_id = r.job_id AND jq.is_required = true
                )
            )
        ) as completed_interviews,
        COUNT(DISTINCT r.profile_id) FILTER (
            WHERE NOT EXISTS (
                SELECT 1 FROM responses r2 
                WHERE r2.profile_id = r.profile_id 
                AND r2.job_id = r.job_id
                HAVING COUNT(*) >= (
                    SELECT COUNT(*) FROM job_questions jq 
                    WHERE jq.job_id = r.job_id AND jq.is_required = true
                )
            )
        ) as in_progress_interviews
    FROM responses r
    GROUP BY r.job_id
) cs ON j.id = cs.job_id

-- Evaluations aggregation
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as total_evaluations,
        COUNT(*) FILTER (WHERE evaluation_type = 'resume') as resume_evaluations,
        COUNT(*) FILTER (WHERE evaluation_type = 'interview') as interview_evaluations,
        COUNT(*) FILTER (WHERE evaluation_type = 'combined') as combined_evaluations,
        ROUND(AVG(score), 2) as avg_score,
        COUNT(*) FILTER (WHERE recommendation IN ('strong_yes', 'yes')) as recommended_candidates
    FROM evaluations
    GROUP BY job_id
) es ON j.id = es.job_id

ORDER BY j.created_at DESC;

-- Create RLS policy for the view
ALTER VIEW job_questions_overview OWNER TO postgres;

-- Grant access to authenticated users (they can only see their own jobs via RLS on jobs table)
GRANT SELECT ON job_questions_overview TO authenticated;

-- Add a comment to document the view
COMMENT ON VIEW job_questions_overview IS 'Comprehensive view showing job details with aggregated counts for questions, candidates, and evaluations. Used for job management dashboards and analytics.';

-- Create an index on the underlying job_questions table for better performance
CREATE INDEX IF NOT EXISTS idx_job_questions_job_id_performance ON job_questions(job_id, is_required, is_ai_generated);

-- Create an index on responses table for candidate counting
CREATE INDEX IF NOT EXISTS idx_responses_job_profile_performance ON responses(job_id, profile_id);

-- Create an index on evaluations table for evaluation stats
CREATE INDEX IF NOT EXISTS idx_evaluations_job_type_performance ON evaluations(job_id, evaluation_type, recommendation); 