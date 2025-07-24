-- Migration: Create team responses feature for candidate evaluation
-- This allows team members to vote and comment on candidates

DROP TABLE IF EXISTS public.team_assessments;

-- Create team_responses table
CREATE TABLE IF NOT EXISTS public.team_responses (
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
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique response per user per candidate per job
    UNIQUE(candidate_id, job_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_team_responses_candidate_id ON public.team_responses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_job_id ON public.team_responses(job_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_user_id ON public.team_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_vote ON public.team_responses(vote);
CREATE INDEX IF NOT EXISTS idx_team_responses_created_at ON public.team_responses(created_at);

-- Enable Row Level Security
ALTER TABLE public.team_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_responses
-- Users can view responses for jobs they have access to
CREATE POLICY "Users can view responses for accessible jobs" ON public.team_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_permissions jp
            WHERE jp.job_id = team_responses.job_id
            AND jp.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM jobs j, profiles p
            WHERE j.id = team_responses.job_id
            AND j.profile_id = auth.uid()
            OR (p.id = auth.uid() AND p.role = 'admin')
        )
    );

-- Users can insert/update their own responses
CREATE POLICY "Users can manage their own responses" ON public.team_responses
    FOR ALL USING (user_id = auth.uid());

-- Job owners and admins can view all responses
CREATE POLICY "Job owners and admins can view all responses" ON public.team_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs j, profiles p
            WHERE j.id = team_responses.job_id
            AND p.id = auth.uid()
            AND (j.profile_id = p.id OR p.role = 'admin')
        )
    );

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_team_responses_updated_at ON public.team_responses;
CREATE TRIGGER update_team_responses_updated_at
    BEFORE UPDATE ON public.team_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for team responses with user details
CREATE OR REPLACE VIEW team_responses_detailed AS
SELECT 
    tr.id,
    tr.candidate_id,
    tr.job_id,
    tr.user_id,
    tr.vote,
    tr.comment,
    tr.confidence_level,
    tr.technical_skills,
    tr.communication_skills,
    tr.cultural_fit,
    tr.created_at,
    tr.updated_at,
    
    -- User details
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.email as user_email,
    p.role as user_role,
    
    -- Candidate details (via candidates_info)
    ci.first_name as candidate_first_name,
    ci.last_name as candidate_last_name,
    ci.email as candidate_email,
    
    -- Job details
    j.title as job_title
    
FROM public.team_responses tr
LEFT JOIN public.profiles p ON tr.user_id = p.id
LEFT JOIN public.candidates c ON tr.candidate_id = c.id
LEFT JOIN public.candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN public.jobs j ON tr.job_id = j.id;

-- Grant permissions for the view
GRANT SELECT ON public.team_responses_detailed TO authenticated;
GRANT SELECT ON public.team_responses_detailed TO service_role;

-- Create function to get team response summary for a candidate
CREATE OR REPLACE FUNCTION get_team_response_summary(
    p_candidate_id UUID,
    p_job_id UUID
)
RETURNS TABLE (
    total_responses BIGINT,
    positive_votes BIGINT,
    negative_votes BIGINT,
    neutral_votes BIGINT,
    avg_confidence NUMERIC,
    avg_technical_skills NUMERIC,
    avg_communication_skills NUMERIC,
    avg_cultural_fit NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_responses,
        COUNT(CASE WHEN vote = 'positive' THEN 1 END)::BIGINT as positive_votes,
        COUNT(CASE WHEN vote = 'negative' THEN 1 END)::BIGINT as negative_votes,
        COUNT(CASE WHEN vote = 'neutral' THEN 1 END)::BIGINT as neutral_votes,
        ROUND(AVG(confidence_level), 2) as avg_confidence,
        ROUND(AVG(technical_skills), 2) as avg_technical_skills,
        ROUND(AVG(communication_skills), 2) as avg_communication_skills,
        ROUND(AVG(cultural_fit), 2) as avg_cultural_fit
    FROM public.team_responses
    WHERE candidate_id = p_candidate_id 
    AND job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_team_response_summary(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_response_summary(UUID, UUID) TO service_role;

-- Add comments
COMMENT ON TABLE public.team_responses IS 'Team member responses and votes for job candidates';
COMMENT ON FUNCTION get_team_response_summary(UUID, UUID) IS 'Returns aggregated team response statistics for a candidate'; 