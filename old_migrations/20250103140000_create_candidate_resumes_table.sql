-- Create candidate_resumes table for storing resume file URLs
CREATE TABLE IF NOT EXISTS candidate_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID, -- For future use with candidate management
  email TEXT, -- Candidate email for linking
  first_name TEXT,
  last_name TEXT,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  public_url TEXT NOT NULL, -- Public URL for accessing the file
  file_size BIGINT, -- File size in bytes
  file_type TEXT, -- pdf, doc, docx, txt
  word_count INTEGER,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'success', 'failed')),
  parsing_error TEXT, -- Store any parsing errors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure evaluations table has all required columns
DO $$
BEGIN
  -- Add feedback column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'feedback') THEN
    ALTER TABLE evaluations ADD COLUMN feedback TEXT;
  END IF;
  
  -- Add profile_id column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'profile_id') THEN
    ALTER TABLE evaluations ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add job_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'job_id') THEN
    ALTER TABLE evaluations ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;
  END IF;
  
  -- Add resume_score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_score') THEN
    ALTER TABLE evaluations ADD COLUMN resume_score INTEGER DEFAULT 0;
  END IF;
  
  -- Add resume_summary column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_summary') THEN
    ALTER TABLE evaluations ADD COLUMN resume_summary TEXT;
  END IF;
  
  -- Add resume_filename column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_filename') THEN
    ALTER TABLE evaluations ADD COLUMN resume_filename TEXT;
  END IF;
  
  -- Add evaluation_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'evaluation_type') THEN
    ALTER TABLE evaluations ADD COLUMN evaluation_type TEXT DEFAULT 'interview' CHECK (evaluation_type IN ('resume', 'interview', 'combined'));
  END IF;
  
  -- Add skills_assessment column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'skills_assessment') THEN
    ALTER TABLE evaluations ADD COLUMN skills_assessment JSONB DEFAULT '{}';
  END IF;
  
  -- Add traits_assessment column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'traits_assessment') THEN
    ALTER TABLE evaluations ADD COLUMN traits_assessment JSONB DEFAULT '{}';
  END IF;
  
  -- Add strengths column if it doesn't exist (should be JSONB array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'strengths') THEN
    ALTER TABLE evaluations ADD COLUMN strengths JSONB DEFAULT '[]';
  END IF;
  
  -- Add red_flags column if it doesn't exist (should be JSONB array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'red_flags') THEN
    ALTER TABLE evaluations ADD COLUMN red_flags JSONB DEFAULT '[]';
  END IF;
  
  -- Add recommendation column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'recommendation') THEN
    ALTER TABLE evaluations ADD COLUMN recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no'));
  END IF;
  
  -- Add summary column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'summary') THEN
    ALTER TABLE evaluations ADD COLUMN summary TEXT;
  END IF;
  
  -- Add score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'score') THEN
    ALTER TABLE evaluations ADD COLUMN score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for candidate_resumes
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_job_id ON candidate_resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_email ON candidate_resumes(email);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_created_at ON candidate_resumes(created_at);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_parsing_status ON candidate_resumes(parsing_status);

-- Add RLS policies for candidate_resumes table
ALTER TABLE candidate_resumes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to upload resumes (for interview flow)
CREATE POLICY "Anyone can upload resumes" ON candidate_resumes
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous users to read their own resumes
CREATE POLICY "Anyone can read resumes" ON candidate_resumes
FOR SELECT 
USING (true);

-- Employers can view resumes for their jobs
CREATE POLICY "Employers can view resumes for their jobs" ON candidate_resumes
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN profiles p ON j.profile_id = p.id
    WHERE j.id = job_id 
    AND p.id = auth.uid()
  )
);

-- Service role can update resumes (for processing status)
CREATE POLICY "Service role can update resumes" ON candidate_resumes
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidate_resumes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_resumes_updated_at
  BEFORE UPDATE ON candidate_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_resumes_updated_at(); 