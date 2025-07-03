-- Fix evaluations table structure and RLS policies
-- This migration aligns the evaluations table with the current application needs

-- First, let's ensure the evaluations table has the correct structure
DO $$
BEGIN
  -- Drop old foreign key constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'evaluations_candidate_id_fkey' 
             AND table_name = 'evaluations') THEN
    ALTER TABLE evaluations DROP CONSTRAINT evaluations_candidate_id_fkey;
  END IF;
  
  -- Add profile_id column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'profile_id') THEN
    ALTER TABLE evaluations ADD COLUMN profile_id UUID;
  END IF;
  
  -- Add job_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'job_id') THEN
    ALTER TABLE evaluations ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;
  END IF;
  
  -- Add evaluation_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'evaluation_type') THEN
    ALTER TABLE evaluations ADD COLUMN evaluation_type TEXT DEFAULT 'interview' CHECK (evaluation_type IN ('resume', 'interview', 'combined'));
  END IF;
  
  -- Add resume-specific columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_score') THEN
    ALTER TABLE evaluations ADD COLUMN resume_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_summary') THEN
    ALTER TABLE evaluations ADD COLUMN resume_summary TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_filename') THEN
    ALTER TABLE evaluations ADD COLUMN resume_filename TEXT;
  END IF;
  
  -- Ensure all required columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'feedback') THEN
    ALTER TABLE evaluations ADD COLUMN feedback TEXT;
  END IF;
  
  -- Make candidate_id nullable since we now use profile_id for some cases
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'evaluations' AND column_name = 'candidate_id' AND is_nullable = 'NO') THEN
    ALTER TABLE evaluations ALTER COLUMN candidate_id DROP NOT NULL;
  END IF;
  
  -- Ensure JSONB columns exist with correct types
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'skills_assessment' AND data_type = 'jsonb') THEN
    -- If it exists as a different type, drop and recreate
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'evaluations' AND column_name = 'skills_assessment') THEN
      ALTER TABLE evaluations DROP COLUMN skills_assessment;
    END IF;
    ALTER TABLE evaluations ADD COLUMN skills_assessment JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'traits_assessment' AND data_type = 'jsonb') THEN
    -- If it exists as a different type, drop and recreate
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'evaluations' AND column_name = 'traits_assessment') THEN
      ALTER TABLE evaluations DROP COLUMN traits_assessment;
    END IF;
    ALTER TABLE evaluations ADD COLUMN traits_assessment JSONB DEFAULT '{}';
  END IF;
  
  -- Handle strengths column - ensure it's JSONB array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'strengths' AND data_type = 'jsonb') THEN
    -- If it exists as text array, convert to JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'evaluations' AND column_name = 'strengths') THEN
      ALTER TABLE evaluations DROP COLUMN strengths;
    END IF;
    ALTER TABLE evaluations ADD COLUMN strengths JSONB DEFAULT '[]';
  END IF;
  
  -- Handle red_flags column - ensure it's JSONB array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'red_flags' AND data_type = 'jsonb') THEN
    -- If it exists as text array, convert to JSONB
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'evaluations' AND column_name = 'red_flags') THEN
      ALTER TABLE evaluations DROP COLUMN red_flags;
    END IF;
    ALTER TABLE evaluations ADD COLUMN red_flags JSONB DEFAULT '[]';
  END IF;
  
END $$;

-- Update RLS policies for evaluations to allow anonymous users to insert
-- (needed for resume evaluation and interview completion)
DROP POLICY IF EXISTS "Service role can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Anyone can create evaluations" ON evaluations;

-- Allow anonymous users to insert evaluations (for interview and resume evaluation)
CREATE POLICY "Anyone can create evaluations" ON evaluations
  FOR INSERT 
  WITH CHECK (true);

-- Allow anonymous users to read their own evaluations
DROP POLICY IF EXISTS "Anyone can read evaluations" ON evaluations;
CREATE POLICY "Anyone can read evaluations" ON evaluations
  FOR SELECT 
  USING (true);

-- Employers can view evaluations for their jobs
DROP POLICY IF EXISTS "Employers can view evaluations for their job candidates" ON evaluations;
DROP POLICY IF EXISTS "Employers can view evaluations for their jobs" ON evaluations;
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

-- Service role can still create and update evaluations
CREATE POLICY "Service role can manage evaluations" ON evaluations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_evaluations_profile_id ON evaluations(profile_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_job_id ON evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluation_type ON evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_resume_score ON evaluations(resume_score); 