-- Fix Circular RLS Completely Migration
-- This migration completely eliminates circular RLS dependencies between jobs and job_permissions

-- ============================================================================
-- PART 1: Drop dependent views first
-- ============================================================================

-- Drop views that depend on candidate_details
DROP VIEW IF EXISTS company_upcoming_interviews;
DROP VIEW IF EXISTS interview_summary;
DROP VIEW IF EXISTS candidate_summary;

-- ============================================================================
-- PART 2: Drop all problematic policies
-- ============================================================================

-- Drop all policies that create circular references
DROP POLICY IF EXISTS "Team members can view jobs via permissions" ON jobs;
DROP POLICY IF EXISTS "Job owners can manage permissions" ON job_permissions;
DROP POLICY IF EXISTS "Users can view permissions for their jobs" ON job_permissions;
DROP POLICY IF EXISTS "Job owners can manage their jobs" ON jobs;

-- ============================================================================
-- PART 3: Disable RLS on job_permissions to break the cycle
-- ============================================================================

-- Temporarily disable RLS on job_permissions to break the circular dependency
ALTER TABLE job_permissions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Recreate simple jobs policies without job_permissions references
-- ============================================================================

-- Simple job access policy - only for job owners (no team permissions for now)
-- This removes the circular reference to job_permissions entirely
CREATE POLICY "Job owners can manage their jobs" ON jobs
  FOR ALL USING (profile_id = auth.uid());

-- Anonymous users can view published jobs (keep this as is)
-- This policy should already exist and doesn't cause issues

-- ============================================================================
-- PART 5: Create security definer function for team job access
-- ============================================================================

-- Create a security definer function to check if user has access to a job
-- This bypasses RLS entirely for permission checks
CREATE OR REPLACE FUNCTION user_can_access_job(job_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check if user owns the job
  SELECT EXISTS(
    SELECT 1 FROM jobs 
    WHERE id = job_uuid AND profile_id = user_uuid
  ) INTO has_access;
  
  -- If not owner, check permissions table directly (no RLS)
  IF NOT has_access THEN
    SELECT EXISTS(
      SELECT 1 FROM job_permissions 
      WHERE job_id = job_uuid 
      AND user_id = user_uuid 
      AND permission_type IN ('view', 'edit', 'admin')
    ) INTO has_access;
  END IF;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: Create view for job access that uses security definer function
-- ============================================================================

-- Create a view that shows jobs accessible to the current user
CREATE OR REPLACE VIEW accessible_jobs AS
SELECT j.*
FROM jobs j
WHERE j.profile_id = auth.uid()
   OR user_can_access_job(j.id, auth.uid())
   OR j.status = 'published'; -- Anonymous access to published jobs

-- Set security invoker for the view
ALTER VIEW accessible_jobs SET (security_invoker = on);
GRANT SELECT ON accessible_jobs TO authenticated;
GRANT SELECT ON accessible_jobs TO anon;

-- ============================================================================
-- PART 7: Update views to use accessible_jobs instead of jobs directly
-- ============================================================================

-- Update candidate_details view to use accessible_jobs
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

  -- Job information (from accessible_jobs view)
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  j.company_name,

  -- Company information (using security definer function)
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
LEFT JOIN accessible_jobs j ON c.job_id = j.id  -- Use accessible_jobs instead of jobs
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
-- PART 8: Recreate the dependent views
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
JOIN accessible_jobs j ON c.job_id = j.id  -- Use accessible_jobs
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
LEFT JOIN accessible_jobs j ON i.job_id = j.id  -- Use accessible_jobs
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
LEFT JOIN accessible_jobs j ON c.job_id = j.id  -- Use accessible_jobs
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN candidate_details cd ON c.id = cd.id;

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
GRANT EXECUTE ON FUNCTION user_can_access_job(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_access_job(UUID, UUID) TO anon;

-- Grant permissions for job_permissions table (since RLS is disabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON job_permissions TO authenticated;

-- ============================================================================
-- PART 10: Add helpful comments
-- ============================================================================

COMMENT ON FUNCTION user_can_access_job(UUID, UUID) IS 
'Security definer function to check job access without circular RLS dependencies';

COMMENT ON VIEW accessible_jobs IS 
'View showing jobs accessible to current user without circular RLS issues';

COMMENT ON VIEW candidate_details IS 
'Updated candidate details view using accessible_jobs to avoid RLS recursion'; 