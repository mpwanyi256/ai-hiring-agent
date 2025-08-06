-- Update interview architecture based on new requirements

-- First, let's update the profiles table to support candidates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employer' CHECK (role IN ('employer', 'candidate', 'admin'));

-- Create questions table for job-specific questions
CREATE TABLE job_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('general', 'technical', 'behavioral', 'experience', 'custom')),
  category TEXT NOT NULL,
  expected_duration INTEGER DEFAULT 120, -- in seconds
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}', -- for storing additional question metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for job_questions
CREATE INDEX idx_job_questions_job_id ON job_questions(job_id);
CREATE INDEX idx_job_questions_order ON job_questions(job_id, order_index);
CREATE INDEX idx_job_questions_type ON job_questions(question_type);
CREATE INDEX idx_job_questions_required ON job_questions(is_required);

-- Update responses table to reference questions properly
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_candidate_id_fkey;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS job_question_id UUID REFERENCES job_questions(id) ON DELETE CASCADE;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS resume_text TEXT; -- Store resume content for context

-- Add job_id to responses if it doesn't exist (MOVED THIS BEFORE INDEX CREATION)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;

-- Add response_time column if it doesn't exist
ALTER TABLE responses ADD COLUMN IF NOT EXISTS response_time INTEGER DEFAULT 0;

-- Update responses indexes
CREATE INDEX IF NOT EXISTS idx_responses_profile_id ON responses(profile_id);
CREATE INDEX IF NOT EXISTS idx_responses_job_question_id ON responses(job_question_id);
CREATE INDEX IF NOT EXISTS idx_responses_job_id ON responses(job_id);

-- Update evaluations table to include resume evaluation
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_candidate_id_fkey;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS resume_score INTEGER DEFAULT 0; -- 0-100 resume match score
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS resume_summary TEXT; -- AI summary of resume evaluation
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS resume_filename TEXT; -- Original resume filename
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS evaluation_type TEXT DEFAULT 'interview' CHECK (evaluation_type IN ('resume', 'interview', 'combined'));

-- Update evaluations indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_profile_id ON evaluations(profile_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_job_id ON evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_resume_score ON evaluations(resume_score);

-- Create a view for job questions with job details
CREATE OR REPLACE VIEW job_questions_detailed AS
SELECT 
  jq.id,
  jq.job_id,
  jq.question_text,
  jq.question_type,
  jq.category,
  jq.expected_duration,
  jq.is_required,
  jq.order_index,
  jq.is_ai_generated,
  jq.metadata,
  jq.created_at as question_created_at,
  jq.updated_at as question_updated_at,
  j.title as job_title,
  j.profile_id,
  j.interview_format,
  j.status as job_status,
  j.is_active as job_is_active
FROM job_questions jq
JOIN jobs j ON jq.job_id = j.id
ORDER BY jq.job_id, jq.order_index;

-- Create a view for interview sessions (replacing candidates table functionality)
CREATE OR REPLACE VIEW interview_sessions AS
SELECT DISTINCT
  r.profile_id,
  r.job_id,
  j.title as job_title,
  j.interview_token,
  p.email,
  p.first_name,
  p.last_name,
  COUNT(r.id) as total_responses,
  COUNT(jq.id) as total_questions,
  ROUND((COUNT(r.id)::NUMERIC / NULLIF(COUNT(jq.id), 0)) * 100, 2) as completion_percentage,
  MIN(r.created_at) as started_at,
  MAX(r.created_at) as last_response_at,
  CASE 
    WHEN COUNT(r.id) = COUNT(jq.id) THEN true 
    ELSE false 
  END as is_completed,
  SUM(r.response_time) as total_time_spent
FROM responses r
JOIN profiles p ON r.profile_id = p.id
JOIN jobs j ON r.job_id = j.id
LEFT JOIN job_questions jq ON jq.job_id = j.id
WHERE p.role = 'candidate'
GROUP BY r.profile_id, r.job_id, j.title, j.interview_token, p.email, p.first_name, p.last_name;

-- Add RLS policies for job_questions
ALTER TABLE job_questions ENABLE ROW LEVEL SECURITY;

-- Employers can manage questions for their jobs
CREATE POLICY "Employers can manage their job questions" ON job_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

-- Anyone can read questions for active jobs (for interview flow)
CREATE POLICY "Anyone can read questions for active jobs" ON job_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id 
      AND j.is_active = true
    )
  );

-- Update RLS policies for responses (remove candidate_id references)
DROP POLICY IF EXISTS "Anyone can create responses" ON responses;
DROP POLICY IF EXISTS "Anyone can read responses" ON responses;
DROP POLICY IF EXISTS "Employers can view responses for their job candidates" ON responses;

-- New RLS policies for responses using profile_id
CREATE POLICY "Candidates can create their own responses" ON responses
  FOR INSERT 
  WITH CHECK (
    profile_id = auth.uid() 
    OR auth.role() = 'anon' -- Allow anonymous users to create responses with profile_id
  );

CREATE POLICY "Candidates can read their own responses" ON responses
  FOR SELECT 
  USING (
    profile_id = auth.uid()
    OR auth.role() = 'anon' -- Allow anonymous access for interview flow
  );

CREATE POLICY "Employers can view responses for their jobs" ON responses
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

-- Update RLS policies for evaluations
DROP POLICY IF EXISTS "Service role can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Anyone can read evaluations" ON evaluations;
DROP POLICY IF EXISTS "Employers can view evaluations for their job candidates" ON evaluations;
DROP POLICY IF EXISTS "Service role can update evaluations" ON evaluations;

-- New RLS policies for evaluations using profile_id
CREATE POLICY "Service role can create evaluations" ON evaluations
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Candidates can read their own evaluations" ON evaluations
  FOR SELECT 
  USING (
    profile_id = auth.uid()
    OR auth.role() = 'anon' -- Allow anonymous access
  );

CREATE POLICY "Employers can view evaluations for their jobs" ON evaluations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Service role can update evaluations" ON evaluations
  FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Add trigger for job_questions updated_at
CREATE OR REPLACE FUNCTION update_job_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_questions_updated_at
  BEFORE UPDATE ON job_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_job_questions_updated_at();

-- Drop the old candidates table if it exists (since we're using profiles now)
DROP TABLE IF EXISTS candidates CASCADE; 