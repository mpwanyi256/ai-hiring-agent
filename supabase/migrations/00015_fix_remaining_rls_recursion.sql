-- Fix Remaining RLS Recursion Issues Migration
-- This migration fixes the remaining infinite recursion in jobs table RLS policies

-- ============================================================================
-- PART 1: Drop all dependent views first to avoid dependency issues
-- ============================================================================

-- Drop views that depend on candidate_details
DROP VIEW IF EXISTS company_upcoming_interviews;
DROP VIEW IF EXISTS interview_summary;
DROP VIEW IF EXISTS candidate_summary;

-- Drop functions that depend on candidate_details view
DROP FUNCTION IF EXISTS get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER);

-- ============================================================================
-- PART 2: Drop all existing RLS policies on jobs table
-- ============================================================================

-- Drop all existing policies on jobs table to start fresh
DROP POLICY IF EXISTS "Job owners can manage their jobs" ON jobs;
DROP POLICY IF EXISTS "Team members can view accessible jobs" ON jobs;
DROP POLICY IF EXISTS "Users can view their own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can manage their own jobs" ON jobs;

-- ============================================================================
-- PART 3: Create simple, non-recursive RLS policies for jobs
-- ============================================================================

-- Simple policy for job owners - no joins to other tables
CREATE POLICY "Job owners can manage their jobs" ON jobs
  FOR ALL USING (profile_id = auth.uid());

-- Simple policy for team access - direct check without subqueries
CREATE POLICY "Team members can view jobs via permissions" ON jobs
  FOR SELECT USING (
    profile_id = auth.uid() 
    OR 
    id IN (
      SELECT jp.job_id 
      FROM job_permissions jp 
      WHERE jp.user_id = auth.uid()
      AND jp.permission_type IN ('view', 'edit', 'admin')
    )
  );

-- ============================================================================
-- PART 4: Update job_permissions policies to be non-recursive
-- ============================================================================

-- Drop existing job_permissions policies
DROP POLICY IF EXISTS "Users can manage job permissions for their jobs" ON job_permissions;
DROP POLICY IF EXISTS "Users can view job permissions for their accessible jobs" ON job_permissions;

-- Create simple job_permissions policies
CREATE POLICY "Job owners can manage permissions" ON job_permissions
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    job_id IN (
      SELECT id FROM jobs WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view permissions for their jobs" ON job_permissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    job_id IN (
      SELECT id FROM jobs WHERE profile_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 5: Create security definer function to get company info safely
-- ============================================================================

-- Create a security definer function to get company info without RLS issues
CREATE OR REPLACE FUNCTION get_job_company_info(job_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'company_id', c.id::text,
    'company_name', c.name,
    'company_slug', c.slug
  ) INTO result
  FROM jobs j
  JOIN profiles p ON j.profile_id = p.id
  JOIN companies c ON p.company_id = c.id
  WHERE j.id = job_uuid;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: Create safer views that avoid RLS issues
-- ============================================================================

-- Create a simplified candidate_details view that avoids complex joins
DROP VIEW IF EXISTS candidate_details;
CREATE VIEW candidate_details AS
SELECT 
  c.id,
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

  -- Calculate progress percentage
  CASE 
    WHEN c.total_steps > 0 THEN ROUND((c.current_step::FLOAT / c.total_steps::FLOAT) * 100)
    ELSE 0
  END as progress_percentage,

  -- Job information (direct from jobs table)
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  j.company_name,

  -- Company information (using security definer function to avoid RLS)
  get_job_company_info(j.id) ->> 'company_id' as company_id,
  get_job_company_info(j.id) ->> 'company_name' as company_name_full,
  get_job_company_info(j.id) ->> 'company_slug' as company_slug,

  -- Response count
  COALESCE(response_counts.response_count, 0) as response_count,

  -- Evaluation data
  e.id as evaluation_id,
  e.score,
  COALESCE(e.recommendation, e.summary) as recommendation,
  e.summary,
  COALESCE(e.strengths, '[]'::jsonb) as strengths,
  COALESCE(e.red_flags, '[]'::jsonb) as red_flags,
  e.skills_assessment,
  e.traits_assessment,
  e.created_at as evaluation_created_at,

  -- Resume information
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

  -- Resume evaluation data
  e.resume_score,
  e.resume_summary,
  e.evaluation_type,

  -- Candidate status
  c.candidate_status,

  -- Status derived from completion and evaluation
  CASE 
    WHEN c.is_completed AND e.id IS NOT NULL THEN 'completed'
    WHEN c.is_completed AND e.id IS NULL THEN 'completed'
    WHEN NOT c.is_completed AND c.current_step > 1 THEN 'in_progress'
    ELSE 'pending'
  END as status

FROM candidates c
LEFT JOIN jobs j ON c.job_id = j.id
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
  SELECT * FROM candidate_resumes cr2
  WHERE (cr2.candidate_id = c.id OR cr2.email = ci.email)
    AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

-- ============================================================================
-- PART 7: Recreate dependent views
-- ============================================================================

-- Recreate company_upcoming_interviews view
CREATE VIEW company_upcoming_interviews AS
SELECT
  i.id AS interview_id,
  i.date AS interview_date,
  i.time AS interview_time,
  i.status AS interview_status,
  i.calendar_event_id,
  i.meet_link,
  i.title as interview_title,
  i.notes as interview_notes,
  i.duration as interview_duration,
  c.id AS candidate_id,
  cd.first_name AS candidate_first_name,
  cd.last_name AS candidate_last_name,
  cd.email AS candidate_email,
  cd.full_name AS candidate_full_name,
  j.id AS job_id,
  j.title AS job_title,
  cd.company_id AS company_id,
  cd.company_name_full AS company_name,
  cd.company_slug AS company_slug,
  -- Interview details
  i.created_at as interview_created_at,
  i.updated_at as interview_updated_at,
  -- Timezone information
  tz.name as timezone_name,
  tz.display_name as timezone_display_name
FROM interviews i
JOIN candidates c ON i.application_id = c.id
JOIN candidate_details cd ON c.id = cd.id
JOIN jobs j ON c.job_id = j.id
LEFT JOIN timezones tz ON i.timezone_id = tz.id
WHERE (
    (i.date > CURRENT_DATE)
    OR (i.date = CURRENT_DATE AND i.time > CURRENT_TIME)
  );

-- Recreate interview_summary view
CREATE VIEW interview_summary AS
SELECT 
  i.id,
  i.application_id,
  i.job_id,
  i.date,
  i.time,
  i.status,
  i.created_at,
  i.updated_at,
  -- Job information
  j.profile_id,
  j.title as job_title,
  j.company_name,
  -- Company information from candidate details
  cd.company_id,
  cd.company_name_full,
  cd.company_slug,
  -- Candidate information
  c.id as candidate_id,
  cd.first_name as candidate_first_name,
  cd.last_name as candidate_last_name,
  cd.email as candidate_email
FROM interviews i
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN candidates c ON i.application_id = c.id
LEFT JOIN candidate_details cd ON c.id = cd.id;

-- Recreate candidate_summary view
CREATE VIEW candidate_summary AS
SELECT 
  c.id,
  c.job_id,
  c.interview_token,
  c.is_completed,
  c.submitted_at,
  c.created_at,
  c.updated_at,
  c.candidate_status,
  -- Job information
  j.profile_id,
  j.title as job_title,
  j.status as job_status,
  j.company_name,
  -- Company information from candidate details
  cd.company_id,
  cd.company_name_full as company_name_full,
  cd.company_slug as company_slug,
  -- Candidate info
  ci.email,
  ci.first_name,
  ci.last_name,
  COALESCE(NULLIF(TRIM(ci.first_name || ' ' || COALESCE(ci.last_name, '')), ''), 'Anonymous') as full_name
FROM candidates c
LEFT JOIN jobs j ON c.job_id = j.id
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN candidate_details cd ON c.id = cd.id;

-- ============================================================================
-- PART 8: Recreate dependent functions with updated view structure
-- ============================================================================

-- Recreate the get_job_candidate_details function
CREATE OR REPLACE FUNCTION get_job_candidate_details(
    p_company_id UUID,
    p_job_id UUID,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    interview_token TEXT,
    current_step INTEGER,
    total_steps INTEGER,
    is_completed BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    progress_percentage NUMERIC,
    job_title TEXT,
    job_status TEXT,
    company_id TEXT,
    response_count BIGINT,
    evaluation_id UUID,
    score NUMERIC,
    recommendation TEXT,
    summary TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.email,
        cd.first_name,
        cd.last_name,
        cd.full_name,
        cd.interview_token,
        cd.current_step,
        cd.total_steps,
        cd.is_completed,
        cd.submitted_at,
        cd.created_at,
        cd.updated_at,
        cd.progress_percentage,
        cd.job_title,
        cd.job_status,
        cd.company_id,
        cd.response_count,
        cd.evaluation_id,
        cd.score,
        cd.recommendation,
        cd.summary,
        cd.status
    FROM candidate_details cd
    WHERE cd.company_id = p_company_id::text
        AND (p_job_id IS NULL OR cd.job_id = p_job_id)
        AND (p_search IS NULL OR 
             cd.full_name ILIKE '%' || p_search || '%' OR 
             cd.email ILIKE '%' || p_search || '%')
        AND (p_status IS NULL OR cd.status = p_status)
    ORDER BY cd.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 9: Set permissions and security
-- ============================================================================

-- Set security invoker for views
ALTER VIEW candidate_details SET (security_invoker = on);
ALTER VIEW company_upcoming_interviews SET (security_invoker = on);
ALTER VIEW interview_summary SET (security_invoker = on);
ALTER VIEW candidate_summary SET (security_invoker = on);

-- Grant permissions
GRANT SELECT ON candidate_details TO authenticated;
GRANT SELECT ON candidate_details TO anon;
GRANT SELECT ON company_upcoming_interviews TO authenticated;
GRANT SELECT ON interview_summary TO authenticated;
GRANT SELECT ON interview_summary TO anon;
GRANT SELECT ON candidate_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_company_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_company_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PART 10: Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Job owners can manage their jobs" ON jobs IS 
'Simple policy for job owners - no recursive checks';

COMMENT ON POLICY "Team members can view jobs via permissions" ON jobs IS 
'Policy for team access using direct permission checks';

COMMENT ON FUNCTION get_job_company_info(UUID) IS 
'Security definer function to get company info without RLS recursion issues'; 