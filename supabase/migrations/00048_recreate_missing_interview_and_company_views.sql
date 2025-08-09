-- Recreate Missing Interview and Company Views Migration
-- This migration recreates essential views that are referenced in the application but missing from the database

-- ============================================================================
-- PART 1: Create interview_details view (for check-conflicts endpoint)
-- ============================================================================

DROP VIEW IF EXISTS public.interview_details;

CREATE OR REPLACE VIEW public.interview_details AS
SELECT 
  i.id as interview_id,
  i.application_id,
  i.job_id,
  i.date as interview_date,
  i.time as interview_time,
  i.timezone_id,
  i.duration,
  i.status as interview_status,
  i.notes,
  i.meet_link,
  i.calendar_event_id,
  i.created_at,
  i.updated_at,
  i.reminder_sent_at,
  -- Candidate info
  ci.first_name as candidate_first_name,
  ci.last_name as candidate_last_name,
  ci.email as candidate_email,
  CONCAT(ci.first_name, ' ', COALESCE(ci.last_name, '')) as candidate_name,
  -- Job info
  j.title as job_title,
  j.profile_id as job_owner_id,
  -- Company info
  cm.name as company_name,
  cm.id as company_id,
  i.title as event_summary,
  -- Get creator info as JSON object
  json_build_object(
    'id', p.id,
    'name', CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')),
    'email', p.email
  ) as organizer_info
FROM public.interviews i
LEFT JOIN public.candidates c ON i.application_id = c.id
LEFT JOIN public.candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN public.jobs j ON i.job_id = j.id
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies cm ON p.company_id = cm.id;

-- ============================================================================
-- PART 2: Create company_upcoming_interviews view
-- ============================================================================

DROP VIEW IF EXISTS public.company_upcoming_interviews;

CREATE OR REPLACE VIEW public.company_upcoming_interviews AS
SELECT
  i.id AS interview_id,
  i.date AS interview_date,
  i.time AS interview_time,
  i.status AS interview_status,
  i.calendar_event_id,
  i.meet_link,
  c.id AS candidate_id,
  ci.first_name AS candidate_first_name,
  ci.last_name AS candidate_last_name,
  ci.email AS candidate_email,
  j.id AS job_id,
  j.title AS job_title,
  comp.id AS company_id,
  comp.name AS company_name
FROM public.interviews i
JOIN public.candidates c ON i.application_id = c.id
JOIN public.candidates_info ci ON c.candidate_info_id = ci.id
JOIN public.jobs j ON c.job_id = j.id
JOIN public.profiles p ON j.profile_id = p.id
JOIN public.companies comp ON p.company_id = comp.id
WHERE (
    (i.date > CURRENT_DATE)
    OR (i.date = CURRENT_DATE AND i.time > CURRENT_TIME)
  );

-- ============================================================================
-- PART 3: Create company_candidate_pipeline view
-- ============================================================================

DROP VIEW IF EXISTS public.company_candidate_pipeline;

CREATE OR REPLACE VIEW public.company_candidate_pipeline AS
SELECT
  comp.id AS company_id,
  comp.name,
  c.candidate_status as status,
  COUNT(c.id) AS count
FROM public.candidates c
JOIN public.jobs j ON c.job_id = j.id
JOIN public.profiles p ON j.profile_id = p.id
JOIN public.companies comp ON p.company_id = comp.id
WHERE j.status != 'closed'
GROUP BY comp.id, comp.name, c.candidate_status;

-- ============================================================================
-- PART 4: Create candidate_analytics_summary view (if missing)
-- ============================================================================

DROP VIEW IF EXISTS public.candidate_analytics_summary;

CREATE OR REPLACE VIEW public.candidate_analytics_summary AS
SELECT
  j.id as job_id,
  j.title as job_title,
  j.profile_id,
  COUNT(DISTINCT c.id) as total_candidates,
  COUNT(DISTINCT CASE WHEN c.is_completed = true THEN c.id END) as completed_applications,
  COUNT(DISTINCT CASE WHEN ca.id IS NOT NULL THEN ca.candidate_id END) as evaluated_candidates,
  AVG(CASE WHEN ca.resume_score IS NOT NULL THEN ca.resume_score END) as avg_resume_score,
  COUNT(DISTINCT CASE WHEN ca.processing_status = 'completed' THEN ca.candidate_id END) as successful_evaluations,
  COUNT(DISTINCT CASE WHEN ca.processing_status = 'failed' THEN ca.candidate_id END) as failed_evaluations
FROM public.jobs j
LEFT JOIN public.candidates c ON j.id = c.job_id
LEFT JOIN public.candidate_analytics ca ON j.id = ca.job_id
WHERE j.is_active = true
GROUP BY j.id, j.title, j.profile_id;

-- ============================================================================
-- PART 5: Set security and permissions
-- ============================================================================

-- Set security invoker for all views
ALTER VIEW public.interview_details SET (security_invoker = true);
ALTER VIEW public.company_upcoming_interviews SET (security_invoker = true);
ALTER VIEW public.company_candidate_pipeline SET (security_invoker = true);
ALTER VIEW public.candidate_analytics_summary SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.interview_details TO authenticated;
GRANT SELECT ON public.company_upcoming_interviews TO authenticated;
GRANT SELECT ON public.company_candidate_pipeline TO authenticated;
GRANT SELECT ON public.candidate_analytics_summary TO authenticated;

-- Grant access to service role
GRANT SELECT ON public.interview_details TO service_role;
GRANT SELECT ON public.company_upcoming_interviews TO service_role;
GRANT SELECT ON public.company_candidate_pipeline TO service_role;
GRANT SELECT ON public.candidate_analytics_summary TO service_role;

-- ============================================================================
-- PART 6: Add helpful comments
-- ============================================================================

COMMENT ON VIEW public.interview_details IS 'View for checking interview conflicts. Includes interview details with candidate names and job titles for the check-conflicts endpoint.';
COMMENT ON VIEW public.company_upcoming_interviews IS 'View for displaying upcoming interviews by company with candidate and job details.';
COMMENT ON VIEW public.company_candidate_pipeline IS 'View for candidate pipeline analytics by company, showing candidate status distribution for active jobs.';
COMMENT ON VIEW public.candidate_analytics_summary IS 'Summary view of candidate analytics and evaluation metrics per job.';

-- ============================================================================
-- PART 7: Verify the migration
-- ============================================================================

DO $$
DECLARE
    interview_details_exists BOOLEAN;
    upcoming_interviews_exists BOOLEAN;
    pipeline_exists BOOLEAN;
    analytics_summary_exists BOOLEAN;
    total_views_created INTEGER := 0;
BEGIN
    -- Check if views exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'interview_details' AND table_schema = 'public'
    ) INTO interview_details_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'company_upcoming_interviews' AND table_schema = 'public'
    ) INTO upcoming_interviews_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'company_candidate_pipeline' AND table_schema = 'public'
    ) INTO pipeline_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'candidate_analytics_summary' AND table_schema = 'public'
    ) INTO analytics_summary_exists;

    -- Count successful creations
    IF interview_details_exists THEN total_views_created := total_views_created + 1; END IF;
    IF upcoming_interviews_exists THEN total_views_created := total_views_created + 1; END IF;
    IF pipeline_exists THEN total_views_created := total_views_created + 1; END IF;
    IF analytics_summary_exists THEN total_views_created := total_views_created + 1; END IF;

    RAISE NOTICE '✅ Missing interview and company views migration applied';
    RAISE NOTICE '  - interview_details view: %', CASE WHEN interview_details_exists THEN '✅ Created' ELSE '❌ Failed' END;
    RAISE NOTICE '  - company_upcoming_interviews view: %', CASE WHEN upcoming_interviews_exists THEN '✅ Created' ELSE '❌ Failed' END;
    RAISE NOTICE '  - company_candidate_pipeline view: %', CASE WHEN pipeline_exists THEN '✅ Created' ELSE '❌ Failed' END;
    RAISE NOTICE '  - candidate_analytics_summary view: %', CASE WHEN analytics_summary_exists THEN '✅ Created' ELSE '❌ Failed' END;
    RAISE NOTICE '  - Total views created: % out of 4', total_views_created;

    IF total_views_created = 4 THEN
        RAISE NOTICE '  - ✅ All views created successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some views may have creation issues';
    END IF;
END $$; 