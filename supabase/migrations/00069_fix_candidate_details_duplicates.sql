-- Fix Candidate Details View Duplicates Migration
-- This migration fixes the duplicate rows issue in candidate_details view that's causing 
-- "JSON object requested, multiple (or no) rows returned" errors in the Edge Function

-- ============================================================================
-- PART 1: Drop dependent functions and recreate the view properly
-- ============================================================================

-- Drop dependent functions first
DROP FUNCTION IF EXISTS get_job_candidate_details(uuid, text, text, integer, integer);
DROP FUNCTION IF EXISTS get_job_candidate_stats(uuid, uuid);
DROP FUNCTION IF EXISTS get_candidate_with_info(uuid);
DROP FUNCTION IF EXISTS get_candidate_details(text);

-- Drop and recreate the candidate_details view to fix duplicates
DROP VIEW IF EXISTS candidate_details CASCADE;

CREATE OR REPLACE VIEW candidate_details AS
SELECT 
  c.id, -- Unique candidate application identifier
  c.candidate_info_id, -- Reference to personal info (unique per person)
  c.job_id,
  c.interview_token,
  ci.email,
  ci.first_name,
  ci.last_name,
  COALESCE(NULLIF(TRIM(ci.first_name || ' ' || COALESCE(ci.last_name, '')), ''), 'Anonymous') as full_name,
  c.current_step,
  c.total_steps,
  c.is_completed,
  c.submitted_at,
  c.created_at,
  c.updated_at,
  c.candidate_status,
  -- Progress
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0 
  END as progress_percentage,
  -- Job info
  j.title as job_title,
  j.status as job_status,
  j.profile_id, -- For employer filtering only
  j.fields as job_fields,
  -- Response count
  COALESCE(response_counts.response_count, 0) as response_count,
  -- Evaluation data
  e.id as evaluation_id,
  e.score,
  e.recommendation,
  e.summary,
  e.strengths,
  e.red_flags,
  e.skills_assessment,
  e.traits_assessment,
  e.created_at as evaluation_created_at,
  -- Resume info (latest resume per candidate) - FIXED: Use proper LATERAL join
  cr.id as resume_id,
  cr.original_filename as resume_filename,
  cr.file_path as resume_file_path,
  cr.public_url as resume_public_url,
  cr.file_size as resume_file_size,
  cr.file_type as resume_file_type,
  cr.word_count as resume_word_count,
  cr.parsing_status as resume_parsing_status,
  cr.parsing_error as resume_parsing_error,
  cr.created_at as resume_uploaded_at,
  -- Resume evaluation data from evaluations table
  e.resume_score,
  e.resume_summary,
  e.evaluation_type,
  -- Interview details as JSON object (first interview for this candidate, if any)
  (
    SELECT row_to_json(i) FROM (
      SELECT 
        iv.id,
        iv.date,
        iv.time,
        iv.timezone_id,
        iv.duration,
        iv.calendar_event_id,
        iv.meet_link,
        iv.status,
        iv.notes,
        iv.created_at,
        iv.updated_at
      FROM interviews iv
      WHERE iv.application_id = c.id
      ORDER BY iv.created_at ASC
      LIMIT 1
    ) i
  ) AS interview_details
FROM candidates c
INNER JOIN jobs j ON c.job_id = j.id
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN evaluations e ON c.id = e.candidate_id
LEFT JOIN (
  SELECT 
    candidate_id, 
    COUNT(*) as response_count
  FROM responses 
  GROUP BY candidate_id
) response_counts ON c.id = response_counts.candidate_id
LEFT JOIN LATERAL (
  -- FIXED: Proper LATERAL join that ensures only one resume per candidate
  SELECT * FROM candidate_resumes cr2
  WHERE cr2.candidate_id = c.id
    AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

-- ============================================================================
-- PART 2: Recreate all related functions with correct signatures
-- ============================================================================

-- Recreate get_job_candidate_details function
CREATE OR REPLACE FUNCTION get_job_candidate_details(
    p_job_id uuid,
    p_search text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    candidate_info_id uuid,
    job_id uuid,
    interview_token text,
    email text,
    first_name text,
    last_name text,
    full_name text,
    current_step integer,
    total_steps integer,
    is_completed boolean,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    progress_percentage integer,
    job_title text,
    job_status text,
    profile_id uuid,
    job_fields jsonb,
    response_count bigint,
    evaluation_id uuid,
    score integer,
    recommendation text,
    summary text,
    strengths jsonb,
    red_flags jsonb,
    skills_assessment jsonb,
    traits_assessment jsonb,
    evaluation_created_at timestamp with time zone,
    evaluation_type text,
    resume_score integer,
    resume_summary text,
    resume_id uuid,
    resume_filename text,
    resume_file_path text,
    resume_public_url text,
    resume_file_size integer,
    resume_file_type text,
    resume_word_count integer,
    resume_parsing_status text,
    resume_parsing_error text,
    resume_uploaded_at timestamp with time zone,
    candidate_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.candidate_info_id,
        cd.job_id,
        cd.interview_token,
        cd.email,
        cd.first_name,
        cd.last_name,
        cd.full_name,
        cd.current_step,
        cd.total_steps,
        cd.is_completed,
        cd.submitted_at,
        cd.created_at,
        cd.updated_at,
        ROUND(cd.progress_percentage)::integer,
        cd.job_title::text,
        cd.job_status,
        cd.profile_id,
        cd.job_fields,
        cd.response_count,
        cd.evaluation_id,
        cd.score,
        cd.recommendation,
        cd.summary,
        cd.strengths,
        cd.red_flags,
        cd.skills_assessment,
        cd.traits_assessment,
        cd.evaluation_created_at,
        cd.evaluation_type,
        cd.resume_score,
        cd.resume_summary,
        cd.resume_id,
        cd.resume_filename,
        cd.resume_file_path,
        cd.resume_public_url,
        cd.resume_file_size,
        cd.resume_file_type,
        cd.resume_word_count,
        cd.resume_parsing_status,
        cd.resume_parsing_error,
        cd.resume_uploaded_at,
        cd.candidate_status::text
    FROM candidate_details cd
    WHERE cd.job_id = p_job_id
    AND (p_search IS NULL OR 
         cd.full_name ILIKE '%' || p_search || '%' OR 
         cd.email ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR cd.candidate_status::text = p_status)
    ORDER BY cd.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Recreate get_job_candidate_stats function
CREATE OR REPLACE FUNCTION get_job_candidate_stats(
    p_job_id uuid,
    p_profile_id uuid DEFAULT NULL
)
RETURNS TABLE(
    total_candidates bigint,
    completed_candidates bigint,
    in_progress_candidates bigint,
    pending_candidates bigint,
    average_score numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_candidates,
    COUNT(*) FILTER (WHERE cd.candidate_status = 'completed') as completed_candidates,
    COUNT(*) FILTER (WHERE cd.candidate_status = 'in_progress') as in_progress_candidates,
    COUNT(*) FILTER (WHERE cd.candidate_status = 'pending') as pending_candidates,
    ROUND(AVG(cd.score), 0) as average_score
  FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id);
$$;

-- ============================================================================
-- PART 3: Grant permissions
-- ============================================================================

-- Set security invokers for candidate_details view
ALTER VIEW public.candidate_details SET (security_invoker = on);
GRANT SELECT ON public.candidate_details TO authenticated;
GRANT SELECT ON public.candidate_details TO anon;

-- Grant execute permissions to functions
GRANT EXECUTE ON FUNCTION get_job_candidate_details(uuid, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_details(uuid, text, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(uuid, uuid) TO service_role;

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

DO $$
DECLARE
    view_exists BOOLEAN;
    function_exists BOOLEAN;
    stats_function_exists BOOLEAN;
    duplicate_count INTEGER;
BEGIN
    -- Check if view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'candidate_details'
        AND table_schema = 'public'
    ) INTO view_exists;
    
    -- Check if main function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_job_candidate_details'
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if stats function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'get_job_candidate_stats'
        AND routine_schema = 'public'
    ) INTO stats_function_exists;
    
    -- Check for duplicates in the view
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT candidate_info_id, job_id, COUNT(*) 
        FROM candidate_details 
        GROUP BY candidate_info_id, job_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE '✅ Candidate Details View Duplicates Fix Applied';
    RAISE NOTICE '  - View exists: %', view_exists;
    RAISE NOTICE '  - get_job_candidate_details function exists: %', function_exists;
    RAISE NOTICE '  - get_job_candidate_stats function exists: %', stats_function_exists;
    RAISE NOTICE '  - Duplicate records in view: %', duplicate_count;
    
    IF view_exists AND function_exists AND stats_function_exists AND duplicate_count = 0 THEN
        RAISE NOTICE '  - ✅ All fixes applied successfully - no more duplicates!';
    ELSE
        RAISE NOTICE '  - ⚠️  Some issues may remain, check manually';
    END IF;
END $$; 