-- Recreate candidates table for interview flow
-- This migration brings back the candidates table to properly manage candidate data

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  interview_token TEXT NOT NULL,
  email TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_interview_token ON candidates(interview_token);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- Enable RLS for candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert candidates (for interview flow)
DROP POLICY IF EXISTS "Anyone can create candidates" ON candidates;
CREATE POLICY "Anyone can create candidates" ON candidates
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read candidates by interview token or email
DROP POLICY IF EXISTS "Anyone can read candidates by token or email" ON candidates;
CREATE POLICY "Anyone can read candidates by token or email" ON candidates
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

-- Update responses table to reference candidates if candidate_id column doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'responses' AND column_name = 'candidate_id') THEN
    ALTER TABLE responses ADD COLUMN candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update evaluations table to properly reference candidates
DO $$
BEGIN
  -- Add candidate_id foreign key constraint back if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'evaluations_candidate_id_fkey' 
                 AND table_name = 'evaluations') THEN
    -- First make sure candidate_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'evaluations' AND column_name = 'candidate_id') THEN
      ALTER TABLE evaluations ADD COLUMN candidate_id UUID;
    END IF;
    
    -- Add foreign key constraint
    ALTER TABLE evaluations ADD CONSTRAINT evaluations_candidate_id_fkey 
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create trigger to update updated_at timestamp on candidates
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_candidates_updated_at ON candidates;
CREATE TRIGGER trigger_update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_candidates_updated_at();

-- Grant necessary permissions to anonymous users
GRANT SELECT, INSERT, UPDATE ON candidates TO anon;
-- GRANT USAGE ON SEQUENCE candidates_id_seq TO anon;

COMMENT ON TABLE candidates IS 'Stores candidate information for interview sessions';
COMMENT ON COLUMN candidates.interview_token IS 'Unique token used to access the interview';
COMMENT ON COLUMN candidates.email IS 'Candidate email address - must be unique to prevent duplicates';
COMMENT ON COLUMN candidates.current_step IS 'Current step in the interview process';
COMMENT ON COLUMN candidates.total_steps IS 'Total number of steps in the interview';
COMMENT ON COLUMN candidates.is_completed IS 'Whether the candidate has completed the interview'; 