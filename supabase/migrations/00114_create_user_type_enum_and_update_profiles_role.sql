-- Create user_type enum with admin, employer, candidate values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_type'
  ) THEN
    CREATE TYPE user_type AS ENUM ('admin', 'employer', 'candidate');
  END IF;
END$$;

-- Remove the existing check constraint from profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Drop dependent views that reference p.role
DROP VIEW IF EXISTS public.user_details;
DROP VIEW IF EXISTS public.job_permissions_detailed;
DROP VIEW IF EXISTS public.messages_detailed;
DROP VIEW IF EXISTS public.jobs_comprehensive;
DROP VIEW IF EXISTS public.jobs_detailed;
DROP VIEW IF EXISTS public.team_responses_detailed;

-- Drop RLS policies that reference profiles.role
-- Companies
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;
-- Invites
DROP POLICY IF EXISTS "Company admins can manage invites" ON invites;
-- Departments
DROP POLICY IF EXISTS "Company admins can manage departments" ON departments;
-- Job titles
DROP POLICY IF EXISTS "Company admins can manage job titles" ON job_titles;
-- Employment types
DROP POLICY IF EXISTS "Admins can manage employment types" ON employment_types;
-- Job permissions
DROP POLICY IF EXISTS "Job owners can manage permissions" ON public.job_permissions;
-- Messages (several policies reference admin role)
DROP POLICY IF EXISTS "Users can view messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages for accessible jobs" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
-- Message reactions/read status
DROP POLICY IF EXISTS "Users can view reactions for accessible messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can view read status for accessible messages" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.message_read_status;
-- AI evaluations / team assessments / analytics
DROP POLICY IF EXISTS "Users can view AI evaluations for their jobs" ON public.ai_evaluations;
DROP POLICY IF EXISTS "Users can view team assessments for their jobs" ON public.team_assessments;
DROP POLICY IF EXISTS "Users can create team assessments" ON public.team_assessments;
DROP POLICY IF EXISTS "Users can update their own team assessments" ON public.team_assessments;
DROP POLICY IF EXISTS "Users can view analytics for their jobs" ON public.evaluation_analytics;
DROP POLICY IF EXISTS "Service role can manage AI evaluations" ON public.ai_evaluations;
DROP POLICY IF EXISTS "Service role can manage team assessments" ON public.team_assessments;
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.evaluation_analytics;
-- Function logs / service config / currencies
DROP POLICY IF EXISTS "Admins can view function logs" ON function_logs;
DROP POLICY IF EXISTS "Admins can manage service config" ON service_config;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;

-- Drop anonymous realtime policies referencing role
DROP POLICY IF EXISTS "Anonymous can view messages for realtime" ON public.messages;
DROP POLICY IF EXISTS "Anonymous can view reactions for realtime" ON public.message_reactions;
DROP POLICY IF EXISTS "Anonymous can view read status for realtime" ON public.message_read_status;

-- Drop webhook_logs policy that references profiles.role
DROP POLICY IF EXISTS "Admins can manage webhook logs" ON webhook_logs;

-- Drop HR/manager policies early to remove dependencies on profiles.role
DROP POLICY IF EXISTS "HR can manage employment records for their company" ON employment;
DROP POLICY IF EXISTS "Managers can manage performance reviews for their team" ON performance_reviews;
DROP POLICY IF EXISTS "Managers can view time tracking for their company" ON time_tracking;
DROP POLICY IF EXISTS "HR can manage payroll for their company" ON payroll;

-- Drop subscriptions policies that reference profiles.role
DROP POLICY IF EXISTS "Everyone can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;

-- Normalize existing data to avoid NOT NULL violation
UPDATE profiles SET role = 'employer' WHERE role IS NULL;

-- First, drop the existing default
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Update the role column to use the new enum type and make it NOT NULL
ALTER TABLE profiles 
  ALTER COLUMN role TYPE user_type USING role::user_type,
  ALTER COLUMN role SET NOT NULL;

-- Set the new default value after the type change
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'employer'::user_type;

-- Recreate the user_details view (cast role to text to preserve output type)
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role::text AS role,
  p.company_id,
  c.name as company_name,
  p.created_at,
  p.updated_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id;

-- Recreate job_permissions_detailed view (cast role to text)
CREATE OR REPLACE VIEW public.job_permissions_detailed AS
SELECT 
    jp.id,
    jp.job_id,
    jp.user_id,
    jp.permission_level,
    jp.granted_at,
    jp.created_at,
    jp.updated_at,
    p.first_name,
    p.last_name,
    p.email,
    p.role::text as user_role,
    j.title as job_title,
    j.profile_id as job_owner_id,
    j.created_at as job_created_at
FROM public.job_permissions jp
LEFT JOIN public.profiles p ON jp.user_id = p.id
LEFT JOIN public.jobs j ON jp.job_id = j.id;

-- Recreate messages_detailed view (cast role to text)
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
  p.first_name as user_first_name,
  p.last_name as user_last_name,
  p.email as user_email,
  p.role::text as user_role
FROM public.messages m
LEFT JOIN public.profiles p ON m.user_id = p.id;

-- Recreate jobs_comprehensive view (cast role to text in JSON)
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
        'first_name', p.first_name,
        'last_name', p.last_name,
        'role', p.role::text,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) as creator_details,
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    d.name as department_name,
    jt.name as job_title_name,
    et.name as employment_type_name
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.departments d ON j.department_id = d.id
LEFT JOIN public.job_titles jt ON j.job_title_id = jt.id
LEFT JOIN public.employment_types et ON j.employment_type_id = et.id;

-- Recreate jobs_detailed view (cast role to text)
CREATE OR REPLACE VIEW public.jobs_detailed AS
SELECT 
    j.*,
    p.first_name,
    p.last_name,
    p.email,
    p.role::text as role
FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id;

-- Recreate team_responses_detailed view (cast role to text)
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
    p.role::text as user_role
FROM public.team_responses tr
LEFT JOIN public.profiles p ON tr.user_id = p.id;

-- Recreate RLS policies with enum comparisons
-- Companies
CREATE POLICY "Company admins can update their company" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.company_id = companies.id 
            AND p.role = 'admin'::user_type
        )
    );

-- Invites
CREATE POLICY "Company admins can manage invites" ON invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = invites.company_id AND p.role = 'admin'::user_type
    )
  );

-- Departments
CREATE POLICY "Company admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = departments.company_id AND p.role = 'admin'::user_type
    )
  );

-- Job titles
CREATE POLICY "Company admins can manage job titles" ON job_titles
  FOR ALL USING (
    company_id IS NULL OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = job_titles.company_id AND p.role = 'admin'::user_type
    )
  );

-- Employment types
CREATE POLICY "Admins can manage employment types" ON employment_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_type
    )
  );

-- Job permissions
CREATE POLICY "Job owners can manage permissions" ON public.job_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p, public.jobs j
            WHERE p.id = auth.uid()
            AND j.id = job_permissions.job_id
            AND (
                j.profile_id = p.id  -- Job owner
                OR p.role = 'admin'::user_type  -- Company admin
            )
        )
    );

-- Messages
CREATE POLICY "Users can view messages for accessible jobs" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = messages.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = messages.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Users can send messages for accessible jobs" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE jobs.id = messages.job_id 
        AND jobs.profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.job_permissions jp
        WHERE jp.job_id = messages.job_id
        AND jp.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'::user_type
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Message reactions/read status
CREATE POLICY "Users can view reactions for accessible messages" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.jobs 
          WHERE jobs.id = m.job_id 
          AND jobs.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() 
          AND p.role = 'admin'::user_type
        )
      )
    )
  );

CREATE POLICY "Users can view read status for accessible messages" ON public.message_read_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_read_status.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.jobs j, public.profiles p
          WHERE j.id = m.job_id
          AND j.profile_id = auth.uid()
          OR (p.id = auth.uid() AND p.role = 'admin'::user_type)
        )
      )
    )
  );

CREATE POLICY "Users can manage their own reactions" ON public.message_reactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own read status" ON public.message_read_status
  FOR ALL USING (user_id = auth.uid());

-- AI evaluations / team assessments / analytics
CREATE POLICY "Users can view AI evaluations for their jobs" ON public.ai_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = ai_evaluations.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Service role can manage AI evaluations" ON public.ai_evaluations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view team assessments for their jobs" ON public.team_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    ) 
    OR assessor_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = team_assessments.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Users can create team assessments" ON public.team_assessments
  FOR INSERT WITH CHECK (
    assessor_profile_id = auth.uid() AND
    (EXISTS (
      SELECT 1 FROM public.jobs j 
      WHERE j.id = job_id AND j.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = job_id
      AND jp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own team assessments" ON public.team_assessments
  FOR UPDATE USING (assessor_profile_id = auth.uid());

CREATE POLICY "Service role can manage team assessments" ON public.team_assessments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view analytics for their jobs" ON public.evaluation_analytics
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = evaluation_analytics.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Service role can manage analytics" ON public.evaluation_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- Function logs / service config / currencies
CREATE POLICY "Admins can view function logs" ON function_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Admins can manage service config" ON service_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Admins can manage currencies" ON currencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'::user_type
    )
  );

-- Recreate anonymous realtime policies with enum comparisons
CREATE POLICY "Anonymous can view messages for realtime" ON public.messages
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = messages.job_id 
      AND jobs.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.job_permissions jp
      WHERE jp.job_id = messages.job_id
      AND jp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'::user_type
    )
  );

CREATE POLICY "Anonymous can view reactions for realtime" ON public.message_reactions
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.jobs 
          WHERE jobs.id = m.job_id 
          AND jobs.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() 
          AND p.role = 'admin'::user_type
        )
      )
    )
  );

CREATE POLICY "Anonymous can view read status for realtime" ON public.message_read_status
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_read_status.message_id
      AND (
        EXISTS (
          SELECT 1 FROM public.job_permissions jp
          WHERE jp.job_id = m.job_id
          AND jp.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.jobs j, public.profiles p
          WHERE j.id = m.job_id
          AND j.profile_id = auth.uid()
          OR (p.id = auth.uid() AND p.role = 'admin'::user_type)
        )
      )
    )
  );

-- Recreate HR/manager policies with enum comparisons
CREATE POLICY "HR can manage employment records for their company" ON employment
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM profiles p1, profiles p2 
      WHERE p1.id = auth.uid() 
      AND p2.id = employment.profile_id 
      AND p1.company_id = p2.company_id
      AND p1.role IN ('admin'::user_type, 'hr'::user_type)
    )
  );

CREATE POLICY "Managers can manage performance reviews for their team" ON performance_reviews
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM employment e, profiles p1, profiles p2 
      WHERE e.id = performance_reviews.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND (p1.role IN ('admin'::user_type, 'hr'::user_type) OR performance_reviews.reviewer_id = auth.uid())
    )
  );

CREATE POLICY "Managers can view time tracking for their company" ON time_tracking
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM employment e, profiles p1, profiles p2 
      WHERE e.id = time_tracking.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND p1.role IN ('admin'::user_type, 'hr'::user_type, 'manager'::user_type)
    )
  );

CREATE POLICY "HR can manage payroll for their company" ON payroll
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM employment e, profiles p1, profiles p2 
      WHERE e.id = payroll.employment_id 
      AND p1.id = auth.uid() 
      AND p2.id = e.profile_id 
      AND p1.company_id = p2.company_id
      AND p1.role IN ('admin'::user_type, 'hr'::user_type)
    )
  );

-- Recreate subscriptions policies with enum comparisons
CREATE POLICY "Everyone can view subscriptions" ON subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert subscriptions" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_type
    )
  );

CREATE POLICY "Admins can update subscriptions" ON subscriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_type
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_type
    )
  );

CREATE POLICY "Admins can delete subscriptions" ON subscriptions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_type
    )
  );

-- Security invokers to contract_offer_details and contract_offers_comprehensive Views
ALTER VIEW public.contract_offer_details SET (security_invoker = on);
ALTER VIEW public.contract_offers_comprehensive SET (security_invoker = on);

-- Recreate webhook_logs policy with enum comparison
CREATE POLICY "Admins can manage webhook logs" ON webhook_logs
  FOR ALL USING (
    auth.role() = 'admin' OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_type
    )
  );
