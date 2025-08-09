-- Migration: Create team_responses_detailed view
-- This creates the missing view that provides detailed team response information

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

-- Add comment
COMMENT ON VIEW public.team_responses_detailed IS 'Detailed view of team responses with user and candidate information'; 