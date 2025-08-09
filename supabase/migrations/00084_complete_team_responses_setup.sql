-- Migration: Complete team_responses setup with missing components
-- This adds the missing get_team_response_summary function, indexes, RLS policies, and triggers

-- ============================================================================
-- PART 1: Add missing indexes
-- ============================================================================

-- Add missing index for created_at
CREATE INDEX IF NOT EXISTS idx_team_responses_created_at ON public.team_responses(created_at);

-- ============================================================================
-- PART 2: Add missing RLS policies
-- ============================================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view team responses for accessible jobs" ON public.team_responses;
DROP POLICY IF EXISTS "Users can insert team responses for accessible jobs" ON public.team_responses;
DROP POLICY IF EXISTS "Users can update their own team responses" ON public.team_responses;

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

-- ============================================================================
-- PART 3: Add missing trigger
-- ============================================================================

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_team_responses_updated_at ON public.team_responses;
CREATE TRIGGER update_team_responses_updated_at
    BEFORE UPDATE ON public.team_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 4: Create get_team_response_summary function
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_team_response_summary(UUID, UUID);

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

-- ============================================================================
-- PART 5: Add comments and documentation
-- ============================================================================

-- Add comments
COMMENT ON TABLE public.team_responses IS 'Team member responses and votes for job candidates';
COMMENT ON FUNCTION get_team_response_summary(UUID, UUID) IS 'Returns aggregated team response statistics for a candidate'; 