-- 00138_convert_profiles_role_to_enum.sql
-- Convert profiles.role from TEXT with CHECK to ENUM and add safe implicit casts

SET search_path = public;

-- Drop dependent views to allow column type alteration
DROP VIEW IF EXISTS public.user_details CASCADE;
DROP VIEW IF EXISTS public.messages_detailed CASCADE;
DROP VIEW IF EXISTS public.jobs_detailed CASCADE;
DROP VIEW IF EXISTS public.user_jobs CASCADE;
DROP VIEW IF EXISTS public.company_jobs CASCADE;
DROP VIEW IF EXISTS public.job_permissions_detailed CASCADE;
DROP VIEW IF EXISTS public.jobs_comprehensive CASCADE;
DROP VIEW IF EXISTS public.team_responses_detailed CASCADE;

-- Drop dependent policies that reference profiles.role to allow type change
DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;
DROP POLICY IF EXISTS "Company admins can manage invites" ON public.invites;
DROP POLICY IF EXISTS "Admins can manage currencies" ON public.currencies;
DROP POLICY IF EXISTS "Admins can manage employment types" ON public.employment_types;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view function logs" ON public.function_logs;
DROP POLICY IF EXISTS "Admins can manage service config" ON public.service_config;
DROP POLICY IF EXISTS "Users can view messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Anonymous can view messages for realtime" ON public.messages;
DROP POLICY IF EXISTS "Anonymous can view reactions for realtime" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can view reactions on accessible messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can view reactions for accessible messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Admins can manage webhook logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "HR can manage employment records for their company" ON public.employment;
DROP POLICY IF EXISTS "Managers can view time tracking for their company" ON public.time_tracking;
DROP POLICY IF EXISTS "HR can manage payroll for their company" ON public.payroll;
DROP POLICY IF EXISTS "Users can view their own performance reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Managers can manage performance reviews for their team" ON public.performance_reviews;
DROP POLICY IF EXISTS "Users can view their own payroll" ON public.payroll;
DROP POLICY IF EXISTS "Anonymous can view read status for realtime" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can view read status for accessible messages" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can view AI evaluations for their jobs" ON public.ai_evaluations;
DROP POLICY IF EXISTS "Users can view team assessments for their jobs" ON public.team_assessments;
DROP POLICY IF EXISTS "Users can view analytics for their jobs" ON public.evaluation_analytics;
DROP POLICY IF EXISTS "Users can view responses for accessible jobs" ON public.team_responses;
DROP POLICY IF EXISTS "Job owners and admins can view all responses" ON public.team_responses;

-- Drop tables that depend on profiles.role policies to unblock enum conversion (per request)
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.payroll CASCADE;

-- 1) Create enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'employer', 'candidate', 'recruiter');
  END IF;
END$$;

-- Do not add new enum labels; compare via text for historical roles

-- 2) Add implicit casts between text/varchar and user_role to avoid breaking existing policies
--    These allow expressions like role = 'admin' to continue working.
DO $$
BEGIN
  -- text -> user_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_cast c
    JOIN pg_type s ON c.castsource = s.oid
    JOIN pg_type t ON c.casttarget = t.oid
    WHERE s.typname = 'text' AND t.typname = 'user_role'
  ) THEN
    CREATE CAST (text AS public.user_role) WITH INOUT AS IMPLICIT;
  END IF;

  -- varchar -> user_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_cast c
    JOIN pg_type s ON c.castsource = s.oid
    JOIN pg_type t ON c.casttarget = t.oid
    WHERE s.typname = 'varchar' AND t.typname = 'user_role'
  ) THEN
    CREATE CAST (varchar AS public.user_role) WITH INOUT AS IMPLICIT;
  END IF;

  -- user_role -> text (usually available via OUT, but ensure explicit cast exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_cast c
    JOIN pg_type s ON c.castsource = s.oid
    JOIN pg_type t ON c.casttarget = t.oid
    WHERE s.typname = 'user_role' AND t.typname = 'text'
  ) THEN
    CREATE CAST (public.user_role AS text) WITH INOUT;
  END IF;
END$$;

-- 3) Drop any existing TEXT check constraint and alter column to enum
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role,
  ALTER COLUMN role SET DEFAULT 'employer'::public.user_role;

-- 4) Refresh helper function(s) to use enum safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Recreate dropped policies with enum-aware comparisons
CREATE POLICY "Company admins can update their company" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = public.companies.id AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Company admins can manage invites" ON public.invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.company_id = public.invites.company_id AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can manage currencies" ON public.currencies
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can manage employment types" ON public.employment_types
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can update subscriptions" ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'::public.user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
      AND public.profiles.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can view function logs" ON public.function_logs
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can manage service config" ON public.service_config
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Admins can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (
    auth.role() = 'admin' OR EXISTS(
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::public.user_role
    )
  );

CREATE POLICY "HR can manage employment records for their company" ON public.employment
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.employment e, public.profiles p1, public.profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = public.employment.profile_id 
      AND p1.company_id = p2.company_id
      AND (p1.role = 'admin'::public.user_role OR p1.role::text = 'hr')
    )
  );

CREATE POLICY "Managers can view time tracking for their company" ON public.time_tracking
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.employment e, public.profiles p1, public.profiles p2 
      WHERE e.id = public.time_tracking.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND (
        p1.role = 'admin'::public.user_role OR
        p1.role::text = 'hr' OR
        p1.role::text = 'manager'
      )
    )
  );

-- Note: payroll table dropped per request; do not recreate payroll policies

CREATE POLICY "Users can view messages for accessible jobs" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE public.jobs.id = public.messages.job_id 
      AND public.jobs.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = public.messages.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE public.jobs.id = public.messages.job_id 
        AND public.jobs.profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.job_permissions jp
        WHERE jp.job_id = public.messages.job_id
        AND jp.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'::public.user_role
      )
    )
  );

CREATE POLICY "Anonymous can view messages for realtime" ON public.messages
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE public.jobs.id = public.messages.job_id 
      AND public.jobs.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = public.messages.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Anonymous can view reactions for realtime" ON public.message_reactions
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = public.message_reactions.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.jobs 
          WHERE public.jobs.id = m.job_id 
          AND public.jobs.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() 
          AND p.role = 'admin'::public.user_role
        )
      )
    )
  );

-- Recreate users policy for viewing reactions on accessible messages
CREATE POLICY "Users can view reactions on accessible messages" ON public.message_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.jobs j ON m.job_id = j.id
      WHERE m.id = public.message_reactions.message_id
      AND (
        j.profile_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = j.id AND jp.user_id = auth.uid()
        ) OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
        )
      )
    )
  );

-- Also recreate with the original policy name variant
CREATE POLICY "Users can view reactions for accessible messages" ON public.message_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.jobs j ON m.job_id = j.id
      WHERE m.id = public.message_reactions.message_id
      AND (
        j.profile_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = j.id AND jp.user_id = auth.uid()
        ) OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
        )
      )
    )
  );

CREATE POLICY "Anonymous can view read status for realtime" ON public.message_read_status
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = public.message_read_status.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.jobs 
          WHERE public.jobs.id = m.job_id 
          AND public.jobs.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() 
          AND p.role = 'admin'::public.user_role
        )
      )
    )
  );

CREATE POLICY "Users can view read status for accessible messages" ON public.message_read_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.jobs j ON m.job_id = j.id
      WHERE m.id = public.message_read_status.message_id
      AND (
        j.profile_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = j.id AND jp.user_id = auth.uid()
        ) OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
        )
      )
    )
  );

-- AI evaluations policies (enum-aware)
CREATE POLICY "Users can view AI evaluations for their jobs" ON public.ai_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = public.ai_evaluations.job_id AND j.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = public.ai_evaluations.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Users can view team assessments for their jobs" ON public.team_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = public.team_assessments.job_id AND j.profile_id = auth.uid()
    ) 
    OR public.team_assessments.assessor_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = public.team_assessments.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Users can view analytics for their jobs" ON public.evaluation_analytics
  FOR SELECT USING (
    public.evaluation_analytics.profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = public.evaluation_analytics.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::public.user_role
    )
  );

-- team_responses policies (enum-aware)
CREATE POLICY "Users can view responses for accessible jobs" ON public.team_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = public.team_responses.job_id AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.jobs j, public.profiles p
      WHERE (
        j.id = public.team_responses.job_id AND j.profile_id = auth.uid()
      ) OR (
        p.id = auth.uid() AND p.role = 'admin'::public.user_role
      )
    )
  );

CREATE POLICY "Job owners and admins can view all responses" ON public.team_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j, public.profiles p
      WHERE j.id = public.team_responses.job_id
        AND p.id = auth.uid()
        AND (
          j.profile_id = p.id OR p.role = 'admin'::public.user_role
        )
    )
  );

-- 5) Recreate user_details view (same structure as 00024)
CREATE VIEW public.user_details AS
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at as user_created_at,
    p.updated_at as user_updated_at,
    
    -- Company details
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.created_at as company_created_at,
    
    -- Subscription details (may be null for new users)
    s.id as subscription_id,
    s.name as subscription_name,
    s.description as subscription_description,
    s.price_monthly,
    s.price_yearly,
    s.max_jobs,
    s.max_interviews_per_month,
    s.features as subscription_features,
    
    -- Stripe data (environment-aware)
    s.stripe_price_id_dev,
    s.stripe_price_id_prod,
    s.stripe_price_id_dev_yearly,
    s.stripe_price_id_prod_yearly,
    s.stripe_checkout_link_dev,
    s.stripe_checkout_link_prod,
    s.stripe_checkout_link_dev_yearly,
    s.stripe_checkout_link_prod_yearly,
    
    -- User subscription status (may be null for new users)
    us.status as subscription_status,
    us.started_at as subscription_started_at,
    us.current_period_start,
    us.current_period_end,
    us.trial_start,
    us.trial_end,
    us.cancel_at_period_end,
    us.stripe_customer_id,
    us.stripe_subscription_id,
    us.updated_at as subscription_updated_at,
    
    -- Usage counts
    (
        SELECT COUNT(*) 
        FROM public.jobs j 
        WHERE j.profile_id = p.id AND j.is_active = true
    ) as active_jobs_count,
    
    (
        SELECT COUNT(*) 
        FROM public.candidates ca
        JOIN public.jobs j ON ca.job_id = j.id
        WHERE j.profile_id = p.id 
        AND ca.submitted_at >= date_trunc('month', NOW())
    ) as interviews_this_month
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.user_subscriptions us ON p.id = us.profile_id
LEFT JOIN public.subscriptions s ON us.subscription_id = s.id;

ALTER VIEW public.user_details SET (security_invoker = on);
GRANT SELECT ON public.user_details TO authenticated;
GRANT SELECT ON public.user_details TO service_role; 

-- 6) Recreate messages_detailed view
CREATE OR REPLACE VIEW public.messages_detailed AS
SELECT 
  m.id,
  m.text,
  m.user_id,
  m.job_id,
  m.reply_to_id,
  m.attachment_url,
  m.attachment_name,
  m.attachment_size,
  m.attachment_type,
  m.created_at,
  m.updated_at,
  m.edited_at,
  m.status,
  
  -- User details
  p.first_name as user_first_name,
  p.last_name as user_last_name,
  p.email as user_email,
  p.role as user_role,
  
  -- Job details
  j.title as job_title,
  
  -- Reply message details
  rm.text as reply_to_text,
  rp.first_name as reply_to_user_first_name,
  rp.last_name as reply_to_user_last_name
 FROM public.messages m
 LEFT JOIN public.profiles p ON m.user_id = p.id
 LEFT JOIN public.jobs j ON m.job_id = j.id
 LEFT JOIN public.messages rm ON m.reply_to_id = rm.id
 LEFT JOIN public.profiles rp ON rm.user_id = rp.id;
 
 ALTER VIEW public.messages_detailed SET (security_invoker = on);
 GRANT SELECT ON public.messages_detailed TO authenticated;
 GRANT SELECT ON public.messages_detailed TO service_role;

-- 7) Recreate jobs_detailed view
CREATE OR REPLACE VIEW public.jobs_detailed AS
SELECT 
    j.*,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    c.name as company_name_full,
    c.slug as company_slug,
    d.name as department_name,
    jt.name as job_title_name,
    et.name as employment_type_name,
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
    COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.departments d ON j.department_id = d.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count,
        COUNT(CASE WHEN submitted_at IS NOT NULL THEN 1 END) as completed_interviews
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id;

ALTER VIEW public.jobs_detailed SET (security_invoker = on);
GRANT SELECT ON public.jobs_detailed TO authenticated;
GRANT SELECT ON public.jobs_detailed TO service_role;

-- 8) Recreate user_jobs view
CREATE OR REPLACE VIEW public.user_jobs AS
SELECT 
    j.*,
    p.first_name,
    p.last_name,
    p.email,
    c.name as company_name,
    c.slug as company_slug,
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN (
    SELECT 
        job_id,
        COUNT(*) as candidate_count
    FROM public.candidates
    GROUP BY job_id
) candidate_stats ON j.id = candidate_stats.job_id
WHERE j.profile_id = auth.uid();

ALTER VIEW public.user_jobs SET (security_invoker = on);
GRANT SELECT ON public.user_jobs TO authenticated;
GRANT SELECT ON public.user_jobs TO service_role;

-- 9) Recreate company_jobs view
CREATE OR REPLACE VIEW public.company_jobs AS
SELECT 
    j.*,
    c.name as company_name,
    c.slug as company_slug
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id;

ALTER VIEW public.company_jobs SET (security_invoker = on);
GRANT SELECT ON public.company_jobs TO authenticated;
GRANT SELECT ON public.company_jobs TO service_role;

-- 10) Recreate job_permissions_detailed view
CREATE OR REPLACE VIEW public.job_permissions_detailed AS
SELECT 
    jp.id,
    jp.job_id,
    jp.user_id,
    jp.permission_level,
    jp.granted_at,
    jp.created_at,
    jp.updated_at,
    -- User details
    p.first_name,
    p.last_name,
    p.email,
    p.role as user_role,
    -- Job details
    j.title as job_title,
    j.profile_id as job_owner_id,
    -- Granted by details
    granter.first_name as granted_by_first_name,
    granter.last_name as granted_by_last_name
FROM public.job_permissions jp
JOIN public.profiles p ON jp.user_id = p.id
JOIN public.jobs j ON jp.job_id = j.id
JOIN public.profiles granter ON jp.granted_by = granter.id;

ALTER VIEW public.job_permissions_detailed SET (security_invoker = on);
GRANT SELECT ON public.job_permissions_detailed TO authenticated; 

-- 11) Recreate jobs_comprehensive view
CREATE OR REPLACE VIEW public.jobs_comprehensive AS
SELECT 
    j.id,
    j.profile_id,
    j.title,
    j.description,
    j.requirements,
    j.location,
    j.salary_range,
    j.employment_type,
    j.status,
    j.fields,
    j.settings,
    j.interview_format,
    j.interview_token,
    j.is_active,
    j.created_at,
    j.updated_at,
    j.department_id,
    j.job_title_id,
    j.employment_type_id,
    j.workplace_type,
    j.job_type,
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    j.salary_period,
    jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'firstName', p.first_name,
        'lastName', p.last_name,
        'role', p.role,
        'avatarUrl', p.avatar_url
    ) as creator_details,
    p.company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.logo_url as company_logo_url,
    c.website as company_website,
    c.industry as company_industry,
    c.size_range as company_size,
    d.name as department_name,
    jt.name as job_title_name,
    et.name as employment_type_name,
    COALESCE(candidate_stats.candidate_count, 0) as candidate_count,
    COALESCE(candidate_stats.completed_interviews, 0) as completed_interviews,
    COALESCE(candidate_stats.response_count, 0) as response_count,
    COALESCE(candidate_stats.evaluation_count, 0) as evaluation_count,
    COALESCE(candidate_stats.average_score, 0) as average_score
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.departments d ON j.department_id = d.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id
LEFT JOIN (
    SELECT 
        cand.job_id,
        COUNT(DISTINCT cand.id) as candidate_count,
        COUNT(DISTINCT CASE WHEN cand.is_completed = true THEN cand.id END) as completed_interviews,
        COUNT(DISTINCT r.id) as response_count,
        COUNT(DISTINCT e.id) as evaluation_count,
        ROUND(AVG(CASE WHEN e.score > 0 THEN e.score END), 2) as average_score
    FROM public.candidates cand
    LEFT JOIN public.responses r ON cand.id = r.candidate_id
    LEFT JOIN public.evaluations e ON cand.id = e.candidate_id AND cand.job_id = e.job_id
    GROUP BY cand.job_id
) candidate_stats ON j.id = candidate_stats.job_id;

ALTER VIEW public.jobs_comprehensive SET (security_invoker = on);
GRANT SELECT ON public.jobs_comprehensive TO authenticated;
GRANT SELECT ON public.jobs_comprehensive TO service_role;

-- 12) Recreate team_responses_detailed view (aligned with current schema)
CREATE OR REPLACE VIEW public.team_responses_detailed AS
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
  p.first_name as user_first_name,
  p.last_name as user_last_name,
  p.email as user_email,
  p.role as user_role,
  j.title as job_title
FROM public.team_responses tr
LEFT JOIN public.profiles p ON tr.user_id = p.id
LEFT JOIN public.jobs j ON tr.job_id = j.id;

ALTER VIEW public.team_responses_detailed SET (security_invoker = on);
GRANT SELECT ON public.team_responses_detailed TO authenticated;
GRANT SELECT ON public.team_responses_detailed TO service_role; 