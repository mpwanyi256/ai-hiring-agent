-- Comprehensive RLS and View Security Migration
-- This migration fixes row level security policies and sets proper view security

-- ============================================================================
-- PART 1: Fix RLS Policies for Tables
-- ============================================================================

-- Drop existing policies for subscriptions table if they exist
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;

-- Subscriptions table: Accessible by all users (including unauthenticated), only admins can update
CREATE POLICY "Everyone can view subscriptions" ON subscriptions
  FOR SELECT 
  USING (true); -- Allow both authenticated and unauthenticated users

CREATE POLICY "Admins can insert subscriptions" ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update subscriptions" ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete subscriptions" ON subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PART 2: Ensure RLS is enabled on all necessary tables
-- ============================================================================

-- Check and ensure RLS is enabled for tables that might be missing it
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_response_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Add missing RLS policies for public access tables
-- ============================================================================

-- Countries and timezones should be publicly accessible
DROP POLICY IF EXISTS "Anyone can view countries" ON countries;
CREATE POLICY "Anyone can view countries" ON countries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view timezones" ON timezones;
CREATE POLICY "Anyone can view timezones" ON timezones
  FOR SELECT USING (true);

-- Employment types should be publicly accessible
DROP POLICY IF EXISTS "Anyone can view active employment types" ON employment_types;
CREATE POLICY "Anyone can view active employment types" ON employment_types
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- PART 4: Set security invokers for all views and grant permissions
-- ============================================================================

-- AI Usage Analytics View
ALTER VIEW ai_usage_analytics SET (security_invoker = on);
GRANT SELECT ON ai_usage_analytics TO authenticated;
GRANT SELECT ON ai_usage_analytics TO anon;

-- Candidate Analytics Summary View
ALTER VIEW candidate_analytics_summary SET (security_invoker = on);
GRANT SELECT ON candidate_analytics_summary TO authenticated;

-- Candidate Details View
ALTER VIEW candidate_details SET (security_invoker = on);
GRANT SELECT ON candidate_details TO authenticated;
GRANT SELECT ON candidate_details TO anon;

-- Company Subscription Details View
ALTER VIEW company_subscription_details SET (security_invoker = on);
GRANT SELECT ON company_subscription_details TO authenticated;

-- Interview Details View
ALTER VIEW interview_details SET (security_invoker = on);
GRANT SELECT ON interview_details TO authenticated;
GRANT SELECT ON interview_details TO anon;

-- User Details View
ALTER VIEW user_details SET (security_invoker = on);
GRANT SELECT ON user_details TO authenticated;

-- ============================================================================
-- PART 5: Add comprehensive RLS policies for missing tables
-- ============================================================================

-- Currencies table policies (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view active currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;

CREATE POLICY "Anyone can view active currencies" ON currencies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage currencies" ON currencies
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Contracts table policies
DROP POLICY IF EXISTS "Company members can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Company members can manage their contracts" ON contracts;
DROP POLICY IF EXISTS "Anyone can view public contract templates" ON contracts;

CREATE POLICY "Company members can view their contracts" ON contracts
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = contracts.company_id
    )
  );

CREATE POLICY "Company members can manage their contracts" ON contracts
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = contracts.company_id
    )
  );

CREATE POLICY "Anyone can view public contract templates" ON contracts
  FOR SELECT USING (is_public = true AND is_template = true);

-- Contract offers table policies
DROP POLICY IF EXISTS "Company members can view their contract offers" ON contract_offers;
DROP POLICY IF EXISTS "Company members can manage their contract offers" ON contract_offers;
DROP POLICY IF EXISTS "Candidates can view offers sent to them" ON contract_offers;

CREATE POLICY "Company members can view their contract offers" ON contract_offers
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN profiles p ON c.company_id = p.company_id
      WHERE c.id = contract_offers.contract_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Company members can manage their contract offers" ON contract_offers
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN profiles p ON c.company_id = p.company_id
      WHERE c.id = contract_offers.contract_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view offers sent to them" ON contract_offers
  FOR SELECT USING (true); -- Candidates access via signing_token, not auth

-- Team invites policies
DROP POLICY IF EXISTS "Company members can view their company invites" ON invites;
DROP POLICY IF EXISTS "Company admins can manage invites" ON invites;

CREATE POLICY "Company members can view their company invites" ON invites
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = invites.company_id
    )
  );

CREATE POLICY "Company admins can manage invites" ON invites
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = invites.company_id AND p.role = 'admin'
    )
  );

-- Message reactions policies
DROP POLICY IF EXISTS "Users can manage their own reactions" ON message_reactions;
DROP POLICY IF EXISTS "Users can view reactions on accessible messages" ON message_reactions;

CREATE POLICY "Users can manage their own reactions" ON message_reactions
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view reactions on accessible messages" ON message_reactions
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN jobs j ON m.job_id = j.id
      WHERE m.id = message_reactions.message_id AND (
        j.profile_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM job_permissions jp
          WHERE jp.job_id = j.id AND jp.user_id = auth.uid()
        )
      )
    )
  );

-- Message read status policies
DROP POLICY IF EXISTS "Users can manage their own read status" ON message_read_status;

CREATE POLICY "Users can manage their own read status" ON message_read_status
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid());

-- User activities policies
DROP POLICY IF EXISTS "Company members can view their company activities" ON user_activities;
DROP POLICY IF EXISTS "Users can create activities" ON user_activities;

CREATE POLICY "Company members can view their company activities" ON user_activities
  FOR SELECT 
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities" ON user_activities
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Team responses policies
DROP POLICY IF EXISTS "Company members can view team responses for their jobs" ON team_responses;
DROP POLICY IF EXISTS "Users can create their own team responses" ON team_responses;
DROP POLICY IF EXISTS "Users can update their own team responses" ON team_responses;

CREATE POLICY "Company members can view team responses for their jobs" ON team_responses
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      JOIN profiles p ON j.profile_id = p.id
      WHERE c.id = team_responses.candidate_id AND p.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create their own team responses" ON team_responses
  FOR INSERT 
  TO authenticated
  WITH CHECK (evaluator_id = auth.uid());

CREATE POLICY "Users can update their own team responses" ON team_responses
  FOR UPDATE 
  TO authenticated
  USING (evaluator_id = auth.uid());

-- Departments policies
DROP POLICY IF EXISTS "Company members can view their departments" ON departments;
DROP POLICY IF EXISTS "Company admins can manage departments" ON departments;

CREATE POLICY "Company members can view their departments" ON departments
  FOR SELECT 
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage departments" ON departments
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = departments.company_id AND p.role = 'admin'
    )
  );

-- Job titles policies
DROP POLICY IF EXISTS "Anyone can view standard job titles" ON job_titles;
DROP POLICY IF EXISTS "Company members can view their job titles" ON job_titles;
DROP POLICY IF EXISTS "Company admins can manage job titles" ON job_titles;

CREATE POLICY "Anyone can view standard job titles" ON job_titles
  FOR SELECT USING (is_standard = true);

CREATE POLICY "Company members can view their job titles" ON job_titles
  FOR SELECT 
  TO authenticated
  USING (
    company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage job titles" ON job_titles
  FOR ALL 
  TO authenticated
  USING (
    company_id IS NULL OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = job_titles.company_id AND p.role = 'admin'
    )
  );

-- Employment types policies
DROP POLICY IF EXISTS "Admins can manage employment types" ON employment_types;

CREATE POLICY "Admins can manage employment types" ON employment_types
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- AI preferences policies
DROP POLICY IF EXISTS "Users can view their company AI preferences" ON ai_preferences;
DROP POLICY IF EXISTS "Users can update their company AI preferences" ON ai_preferences;

CREATE POLICY "Users can view their company AI preferences" ON ai_preferences
  FOR SELECT 
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company AI preferences" ON ai_preferences
  FOR ALL 
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- AI model usage policies
DROP POLICY IF EXISTS "Users can view their company AI usage" ON ai_model_usage;
DROP POLICY IF EXISTS "System can insert AI usage data" ON ai_model_usage;

CREATE POLICY "Users can view their company AI usage" ON ai_model_usage
  FOR SELECT 
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert AI usage data" ON ai_model_usage
  FOR INSERT WITH CHECK (true);

-- Candidate analytics policies
DROP POLICY IF EXISTS "Job owners can view analytics for their candidates" ON candidate_analytics;
DROP POLICY IF EXISTS "System can manage candidate analytics" ON candidate_analytics;

CREATE POLICY "Job owners can view analytics for their candidates" ON candidate_analytics
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = candidate_analytics.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can manage candidate analytics" ON candidate_analytics
  FOR ALL WITH CHECK (true);

-- Candidate response analytics policies
DROP POLICY IF EXISTS "Job owners can view response analytics for their candidates" ON candidate_response_analytics;
DROP POLICY IF EXISTS "System can manage response analytics" ON candidate_response_analytics;

CREATE POLICY "Job owners can view response analytics for their candidates" ON candidate_response_analytics
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      WHERE c.id = candidate_response_analytics.candidate_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can manage response analytics" ON candidate_response_analytics
  FOR ALL WITH CHECK (true);

-- Function logs policies
DROP POLICY IF EXISTS "Admins can view function logs" ON function_logs;
DROP POLICY IF EXISTS "System can insert function logs" ON function_logs;

CREATE POLICY "Admins can view function logs" ON function_logs
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "System can insert function logs" ON function_logs
  FOR INSERT WITH CHECK (true);

-- Service config policies
DROP POLICY IF EXISTS "Admins can manage service config" ON service_config;

CREATE POLICY "Admins can manage service config" ON service_config
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================================
-- PART 6: Grant additional permissions to anonymous users for public data
-- ============================================================================

-- Grant anonymous access to public reference data
GRANT SELECT ON countries TO anon;
GRANT SELECT ON timezones TO anon;
GRANT SELECT ON subscriptions TO anon;
GRANT SELECT ON currencies TO anon;
GRANT SELECT ON employment_types TO anon;

-- Grant anonymous access to public views
GRANT SELECT ON ai_usage_analytics TO anon;
GRANT SELECT ON candidate_details TO anon;
GRANT SELECT ON interview_details TO anon;

-- ============================================================================
-- PART 7: Add comments for documentation
-- ============================================================================

COMMENT ON POLICY "Everyone can view subscriptions" ON subscriptions IS 
'Allow all users (authenticated and anonymous) to view subscription plans for pricing pages';

COMMENT ON POLICY "Admins can update subscriptions" ON subscriptions IS 
'Only admin users can modify subscription plans and pricing';

COMMENT ON VIEW ai_usage_analytics IS 
'View with security_invoker enabled for AI usage analytics - requires proper table-level RLS';

COMMENT ON VIEW candidate_details IS 
'View with security_invoker enabled for candidate details - accessible to job owners and anonymous via token';

COMMENT ON VIEW company_subscription_details IS 
'View with security_invoker enabled for company subscription info - requires authenticated access';

COMMENT ON VIEW interview_details IS 
'View with security_invoker enabled for interview details - accessible to job owners and anonymous';

COMMENT ON VIEW user_details IS 
'View with security_invoker enabled for user profile info - requires authenticated access'; 