-- Team Management and Invites System Migration
-- This migration adds team invites, enhanced messaging, and activity tracking

-- Create invites table for team invitations
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    role TEXT NOT NULL DEFAULT 'employer' CHECK (role IN ('admin', 'employer', 'candidate')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad', 'thumbs_up', 'thumbs_down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- Create message read status table
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create user_activities table for activity tracking
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'candidate_status_change', 'contract_sent', 'interview_scheduled', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'candidate', 'contract', 'interview', etc.
    entity_id UUID NOT NULL, -- ID of the related entity
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_responses table for team feedback
CREATE TABLE IF NOT EXISTS team_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
    feedback TEXT,
    recommendation TEXT CHECK (recommendation IN ('hire', 'no_hire', 'maybe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(candidate_id, evaluator_id)
);

-- Create departments table for better job organization
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, company_id)
);

-- Create job_titles table for standardized titles
CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    is_standard BOOLEAN DEFAULT false, -- Standard titles vs company-specific
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(title, company_id)
);

-- Create employment_types table for standardized employment types
CREATE TABLE IF NOT EXISTS employment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard employment types
INSERT INTO employment_types (name, description) VALUES
    ('full-time', 'Full-time permanent position'),
    ('part-time', 'Part-time position'),
    ('contract', 'Contract or temporary position'),
    ('internship', 'Internship position'),
    ('freelance', 'Freelance or consultant position'),
    ('remote', 'Remote work position'),
    ('hybrid', 'Hybrid work position')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_company_id ON invites(company_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_company_id ON user_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_entity_type_id ON user_activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_team_responses_candidate_id ON team_responses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_evaluator_id ON team_responses(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_team_responses_recommendation ON team_responses(recommendation);

CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_department_id ON job_titles(department_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_company_id ON job_titles(company_id);
CREATE INDEX IF NOT EXISTS idx_employment_types_is_active ON employment_types(is_active);

-- Enable Row Level Security
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invites
CREATE POLICY "Company members can view their company invites" ON invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = invites.company_id
    )
  );

CREATE POLICY "Company admins can manage invites" ON invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = invites.company_id AND p.role = 'admin'
    )
  );

-- RLS Policies for message reactions
CREATE POLICY "Users can manage their own reactions" ON message_reactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view reactions on accessible messages" ON message_reactions
  FOR SELECT USING (
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

-- RLS Policies for message read status
CREATE POLICY "Users can manage their own read status" ON message_read_status
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user_activities
CREATE POLICY "Company members can view their company activities" ON user_activities
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities" ON user_activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for team_responses
CREATE POLICY "Company members can view team responses for their jobs" ON team_responses
  FOR SELECT USING (
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
  FOR INSERT WITH CHECK (evaluator_id = auth.uid());

CREATE POLICY "Users can update their own team responses" ON team_responses
  FOR UPDATE USING (evaluator_id = auth.uid());

-- RLS Policies for departments
CREATE POLICY "Company members can view their departments" ON departments
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = departments.company_id AND p.role = 'admin'
    )
  );

-- RLS Policies for job_titles
CREATE POLICY "Anyone can view standard job titles" ON job_titles
  FOR SELECT USING (is_standard = true);

CREATE POLICY "Company members can view their job titles" ON job_titles
  FOR SELECT USING (
    company_id IS NULL OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage job titles" ON job_titles
  FOR ALL USING (
    company_id IS NULL OR EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.company_id = job_titles.company_id AND p.role = 'admin'
    )
  );

-- RLS Policies for employment_types
CREATE POLICY "Anyone can view active employment types" ON employment_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage employment types" ON employment_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Create function to handle invite expiration
CREATE OR REPLACE FUNCTION handle_invite_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-expire invites that are past their expiration date
  IF NEW.expires_at < NOW() AND NEW.status = 'pending' THEN
    NEW.status := 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invite expiration
CREATE TRIGGER trigger_handle_invite_expiration
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION handle_invite_expiration();

-- Create function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_title VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
  user_company_id UUID;
BEGIN
  -- Get user's company ID
  SELECT company_id INTO user_company_id
  FROM profiles 
  WHERE id = p_user_id;

  -- Insert activity log
  INSERT INTO user_activities (
    user_id, company_id, activity_type, entity_type, entity_id, 
    title, description, metadata
  ) VALUES (
    p_user_id, user_company_id, p_activity_type, p_entity_type, p_entity_id,
    p_title, p_description, p_metadata
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get team response summary for a candidate
CREATE OR REPLACE FUNCTION get_team_response_summary(candidate_uuid UUID)
RETURNS TABLE (
  total_responses BIGINT,
  avg_overall_rating NUMERIC,
  avg_technical_skills NUMERIC,
  avg_communication NUMERIC,
  avg_cultural_fit NUMERIC,
  hire_recommendations BIGINT,
  no_hire_recommendations BIGINT,
  maybe_recommendations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_responses,
    ROUND(AVG(tr.overall_rating), 2) as avg_overall_rating,
    ROUND(AVG(tr.technical_skills_rating), 2) as avg_technical_skills,
    ROUND(AVG(tr.communication_rating), 2) as avg_communication,
    ROUND(AVG(tr.cultural_fit_rating), 2) as avg_cultural_fit,
    COUNT(*) FILTER (WHERE recommendation = 'hire')::BIGINT as hire_recommendations,
    COUNT(*) FILTER (WHERE recommendation = 'no_hire')::BIGINT as no_hire_recommendations,
    COUNT(*) FILTER (WHERE recommendation = 'maybe')::BIGINT as maybe_recommendations
  FROM team_responses tr
  WHERE tr.candidate_id = candidate_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at triggers
CREATE TRIGGER update_invites_updated_at
    BEFORE UPDATE ON invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_responses_updated_at
    BEFORE UPDATE ON team_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION log_user_activity(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_response_summary(UUID) TO authenticated; 