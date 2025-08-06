-- Core Database Functions and Views Migration
-- This migration creates essential functions and views used by other migrations

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create candidate_details view
CREATE OR REPLACE VIEW candidate_details AS
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

  -- Job information
  j.title as job_title,
  j.status as job_status,
  j.profile_id,
  j.fields as job_fields,
  j.company_name,

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
  SELECT * FROM candidate_resumes cr2
  WHERE (cr2.candidate_id = c.id OR cr2.email = ci.email)
    AND cr2.job_id = c.job_id
  ORDER BY cr2.created_at DESC, cr2.id DESC
  LIMIT 1
) cr ON TRUE;

-- Create interview_details view
CREATE OR REPLACE VIEW interview_details AS
SELECT 
  i.id,
  i.application_id,
  i.job_id,
  i.title as event_summary,
  i.date,
  i.time,
  i.timezone_id,
  i.duration,
  i.calendar_event_id,
  i.meet_link,
  i.status,
  i.notes,
  i.created_at,
  i.updated_at,
  
  -- Job information
  j.title as job_title,
  j.company_name,
  j.profile_id as job_profile_id,
  
  -- Candidate information
  ci.email as candidate_email,
  ci.first_name as candidate_first_name,
  ci.last_name as candidate_last_name,
  COALESCE(NULLIF(TRIM(ci.first_name || ' ' || COALESCE(ci.last_name, '')), ''), 'Anonymous') as candidate_full_name,
  
  -- Timezone information
  tz.name as timezone_name,
  tz.display_name as timezone_display_name,
  tz.offset_hours,
  tz.offset_minutes
  
FROM interviews i
INNER JOIN jobs j ON i.job_id = j.id
LEFT JOIN candidates c ON i.application_id = c.id
LEFT JOIN candidates_info ci ON c.candidate_info_id = ci.id
LEFT JOIN timezones tz ON i.timezone_id = tz.id;

-- Create user_details view
CREATE OR REPLACE VIEW user_details AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  COALESCE(NULLIF(TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')), ''), 'Anonymous') as full_name,
  p.avatar_url,
  p.role,
  p.company_id,
  p.created_at,
  p.updated_at,
  
  -- Company information
  c.name as company_name,
  c.description as company_description,
  c.website as company_website,
  c.logo_url as company_logo_url,
  c.industry as company_industry,
  c.size_range as company_size_range,
  
  -- Subscription information
  us.subscription_id,
  s.name as subscription_name,
  s.description as subscription_description,
  s.price_monthly,
  s.price_yearly,
  s.features as subscription_features,
  s.limits as subscription_limits,
  us.status as subscription_status,
  us.current_period_start,
  us.current_period_end,
  us.stripe_customer_id,
  us.stripe_subscription_id

FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN user_subscriptions us ON p.id = us.profile_id
LEFT JOIN subscriptions s ON us.subscription_id = s.id;

-- Create database functions
CREATE OR REPLACE FUNCTION get_job_candidate_details(
  p_job_id UUID,
  p_profile_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF candidate_details
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id)
    AND (
      p_search IS NULL OR 
      cd.full_name ILIKE '%' || p_search || '%' OR 
      cd.email ILIKE '%' || p_search || '%'
    )
    AND (
      p_status IS NULL OR 
      p_status = 'all' OR
      cd.status = p_status
    )
  ORDER BY cd.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION get_job_candidate_stats(
  p_job_id UUID,
  p_profile_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_candidates BIGINT,
  completed_candidates BIGINT,
  in_progress_candidates BIGINT,
  pending_candidates BIGINT,
  average_score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'completed') as completed_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'in_progress') as in_progress_candidates,
    COUNT(*) FILTER (WHERE cd.status = 'pending') as pending_candidates,
    ROUND(AVG(cd.score), 0) as average_score
  FROM candidate_details cd
  WHERE 
    cd.job_id = p_job_id
    AND (p_profile_id IS NULL OR cd.profile_id = p_profile_id);
$$;

-- Function to create interview notifications
CREATE OR REPLACE FUNCTION create_interview_notification()
RETURNS TRIGGER AS $$
DECLARE
    job_record RECORD;
    candidate_record RECORD;
    notification_title VARCHAR;
    notification_message TEXT;
    action_url VARCHAR;
BEGIN
    -- Get job and user details
    SELECT j.*, p.company_id, p.first_name || ' ' || p.last_name as interviewer_name
    INTO job_record
    FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = NEW.job_id;

    -- Get candidate details
    SELECT cd.*, ci.first_name, ci.last_name
    INTO candidate_record
    FROM candidate_details cd
    LEFT JOIN candidates_info ci ON ci.id = cd.id
    WHERE cd.id = NEW.application_id;

    -- Skip if no records found
    IF job_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Create notification for job owner
    notification_title := 'New Interview Scheduled';
    notification_message := 'Interview scheduled with ' || COALESCE(candidate_record.first_name || ' ' || candidate_record.last_name, 'candidate') || ' for ' || job_record.title;
    action_url := '/dashboard/interviews/' || NEW.id;

    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (job_record.profile_id, notification_title, notification_message, 'interview', action_url);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to grant job creator permissions
CREATE OR REPLACE FUNCTION grant_job_creator_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant admin permissions to job creator
    INSERT INTO job_permissions (job_id, user_id, permission_type, granted_by)
    VALUES (NEW.id, NEW.profile_id, 'admin', NEW.profile_id)
    ON CONFLICT (job_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_interview_notification
    AFTER INSERT ON interviews
    FOR EACH ROW EXECUTE FUNCTION create_interview_notification();

CREATE TRIGGER trigger_grant_job_creator_permissions
    AFTER INSERT ON jobs
    FOR EACH ROW EXECUTE FUNCTION grant_job_creator_permissions();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for companies
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = companies.id
    )
  );

CREATE POLICY "Company admins can update their company" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = companies.id AND p.role = 'admin'
    )
  );

-- RLS Policies for jobs
CREATE POLICY "Job owners can manage their jobs" ON jobs
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Team members can view jobs with permissions" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = jobs.id AND jp.user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can view published jobs" ON jobs
  FOR SELECT USING (status = 'published');

-- RLS Policies for candidates
CREATE POLICY "Job owners can view their job candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = candidates.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can create candidates" ON candidates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Candidates can view themselves by token" ON candidates
  FOR SELECT USING (true);

-- RLS Policies for candidates_info
CREATE POLICY "Job owners can view candidate info" ON candidates_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      WHERE c.candidate_info_id = candidates_info.id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can create candidate info" ON candidates_info
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous users can update candidate info" ON candidates_info
  FOR UPDATE USING (true);

-- RLS Policies for interviews
CREATE POLICY "Job owners can manage interviews" ON interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = interviews.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view interviews" ON interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_permissions jp
      JOIN jobs j ON jp.job_id = j.id
      WHERE j.id = interviews.job_id AND jp.user_id = auth.uid()
    )
  );

-- RLS Policies for evaluations
CREATE POLICY "Anyone can create evaluations" ON evaluations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read evaluations" ON evaluations
  FOR SELECT USING (true);

CREATE POLICY "Employers can view evaluations for their jobs" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage evaluations" ON evaluations
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for responses
CREATE POLICY "Job owners can view responses" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      WHERE c.id = responses.candidate_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can create responses" ON responses
  FOR INSERT WITH CHECK (true);

-- RLS Policies for candidate_resumes
CREATE POLICY "Job owners can view resumes" ON candidate_resumes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = candidate_resumes.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can upload resumes" ON candidate_resumes
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
  FOR ALL USING (profile_id = auth.uid());

-- RLS Policies for skills and traits
CREATE POLICY "Company members can view company skills" ON skills
  FOR SELECT USING (
    company_id IS NULL OR
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = skills.company_id
    )
  );

CREATE POLICY "Users can manage their own skills" ON skills
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Company members can view company traits" ON traits
  FOR SELECT USING (
    company_id IS NULL OR
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = traits.company_id
    )
  );

CREATE POLICY "Users can manage their own traits" ON traits
  FOR ALL USING (profile_id = auth.uid());

-- RLS Policies for job_templates
CREATE POLICY "Users can manage their own templates" ON job_templates
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Anyone can view public templates" ON job_templates
  FOR SELECT USING (is_public = true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages for accessible jobs" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = messages.job_id AND jp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = messages.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for accessible jobs" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_permissions jp
      WHERE jp.job_id = messages.job_id AND jp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = messages.job_id AND j.profile_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for job_permissions
CREATE POLICY "Job owners can manage permissions" ON job_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_permissions.job_id AND j.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own permissions" ON job_permissions
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
  FOR ALL USING (profile_id = auth.uid());

-- Grant permissions to views and functions
GRANT SELECT ON candidate_details TO authenticated;
GRANT SELECT ON candidate_details TO anon;
GRANT SELECT ON interview_details TO authenticated;
GRANT SELECT ON interview_details TO anon;
GRANT SELECT ON user_details TO authenticated;

GRANT EXECUTE ON FUNCTION get_job_candidate_details(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_candidate_stats(UUID, UUID) TO authenticated; 