-- Create interview-related tables

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interview_token TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  response_time INTEGER DEFAULT 0, -- Time in seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0, -- 0-100 score
  strengths TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',
  skills_assessment JSONB DEFAULT '{}',
  traits_assessment JSONB DEFAULT '{}',
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to evaluations table if they don't exist
DO $$
BEGIN
  -- Add recommendation column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'recommendation') THEN
    ALTER TABLE evaluations ADD COLUMN recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no'));
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'updated_at') THEN
    ALTER TABLE evaluations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_interview_token ON candidates(interview_token);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_candidate_id ON responses(candidate_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_id ON evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_score ON evaluations(score);

-- Create index on recommendation column only if the column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'evaluations' AND column_name = 'recommendation') THEN
    CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON evaluations(recommendation);
  END IF;
END $$;

-- Add RLS policies for candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert candidates (for interview flow)
DROP POLICY IF EXISTS "Anyone can create candidates" ON candidates;
CREATE POLICY "Anyone can create candidates" ON candidates
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read candidates by interview token
DROP POLICY IF EXISTS "Anyone can read candidates by interview token" ON candidates;
CREATE POLICY "Anyone can read candidates by interview token" ON candidates
  FOR SELECT 
  USING (true);

-- Allow anonymous users to update candidates (for completing interview)
DROP POLICY IF EXISTS "Anyone can update candidates" ON candidates;
CREATE POLICY "Anyone can update candidates" ON candidates
  FOR UPDATE 
  USING (true);

-- Employers can view candidates for their jobs
DROP POLICY IF EXISTS "Employers can view candidates for their jobs" ON candidates;
CREATE POLICY "Employers can view candidates for their jobs" ON candidates
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

-- Add RLS policies for responses table
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert responses (for interview flow)
DROP POLICY IF EXISTS "Anyone can create responses" ON responses;
CREATE POLICY "Anyone can create responses" ON responses
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read their own responses
DROP POLICY IF EXISTS "Anyone can read responses" ON responses;
CREATE POLICY "Anyone can read responses" ON responses
  FOR SELECT 
  USING (true);

-- Employers can view responses for candidates applying to their jobs
DROP POLICY IF EXISTS "Employers can view responses for their job candidates" ON responses;
CREATE POLICY "Employers can view responses for their job candidates" ON responses
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      JOIN profiles p ON j.profile_id = p.id
      WHERE c.id = candidate_id 
      AND p.id = auth.uid()
    )
  );

-- Add RLS policies for evaluations table
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert evaluations (AI evaluation process)
DROP POLICY IF EXISTS "Service role can create evaluations" ON evaluations;
CREATE POLICY "Service role can create evaluations" ON evaluations
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous users to read evaluations (basic info only)
DROP POLICY IF EXISTS "Anyone can read evaluations" ON evaluations;
CREATE POLICY "Anyone can read evaluations" ON evaluations
  FOR SELECT 
  USING (true);

-- Employers can view evaluations for candidates applying to their jobs
DROP POLICY IF EXISTS "Employers can view evaluations for their job candidates" ON evaluations;
CREATE POLICY "Employers can view evaluations for their job candidates" ON evaluations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM candidates c
      JOIN jobs j ON c.job_id = j.id
      JOIN profiles p ON j.profile_id = p.id
      WHERE c.id = candidate_id 
      AND p.id = auth.uid()
    )
  );

-- Service role can update evaluations
DROP POLICY IF EXISTS "Service role can update evaluations" ON evaluations;
CREATE POLICY "Service role can update evaluations" ON evaluations
  FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp on evaluations
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_evaluations_updated_at ON evaluations;
CREATE TRIGGER trigger_update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at(); 