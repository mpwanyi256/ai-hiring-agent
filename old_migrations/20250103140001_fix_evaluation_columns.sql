-- Fix missing columns in evaluations table
-- Run this in your Supabase SQL Editor

-- Add missing columns to evaluations table
DO $$
BEGIN
  -- Add skills_assessment column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'skills_assessment') THEN
    ALTER TABLE evaluations ADD COLUMN skills_assessment JSONB DEFAULT '{}';
    RAISE NOTICE 'Added skills_assessment column';
  END IF;
  
  -- Add traits_assessment column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'traits_assessment') THEN
    ALTER TABLE evaluations ADD COLUMN traits_assessment JSONB DEFAULT '{}';
    RAISE NOTICE 'Added traits_assessment column';
  END IF;
  
  -- Add strengths column if it doesn't exist (should be JSONB array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'strengths') THEN
    ALTER TABLE evaluations ADD COLUMN strengths JSONB DEFAULT '[]';
    RAISE NOTICE 'Added strengths column';
  END IF;
  
  -- Add red_flags column if it doesn't exist (should be JSONB array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'red_flags') THEN
    ALTER TABLE evaluations ADD COLUMN red_flags JSONB DEFAULT '[]';
    RAISE NOTICE 'Added red_flags column';
  END IF;
  
  -- Add recommendation column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'recommendation') THEN
    ALTER TABLE evaluations ADD COLUMN recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no'));
    RAISE NOTICE 'Added recommendation column';
  END IF;
  
  -- Add summary column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'summary') THEN
    ALTER TABLE evaluations ADD COLUMN summary TEXT;
    RAISE NOTICE 'Added summary column';
  END IF;
  
  -- Add score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'score') THEN
    ALTER TABLE evaluations ADD COLUMN score INTEGER DEFAULT 0;
    RAISE NOTICE 'Added score column';
  END IF;
  
  -- Add feedback column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'feedback') THEN
    ALTER TABLE evaluations ADD COLUMN feedback TEXT;
    RAISE NOTICE 'Added feedback column';
  END IF;
  
  -- Add profile_id column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'profile_id') THEN
    ALTER TABLE evaluations ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added profile_id column';
  END IF;
  
  -- Add job_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'job_id') THEN
    ALTER TABLE evaluations ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added job_id column';
  END IF;
  
  -- Add resume_score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_score') THEN
    ALTER TABLE evaluations ADD COLUMN resume_score INTEGER DEFAULT 0;
    RAISE NOTICE 'Added resume_score column';
  END IF;
  
  -- Add resume_summary column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_summary') THEN
    ALTER TABLE evaluations ADD COLUMN resume_summary TEXT;
    RAISE NOTICE 'Added resume_summary column';
  END IF;
  
  -- Add resume_filename column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'resume_filename') THEN
    ALTER TABLE evaluations ADD COLUMN resume_filename TEXT;
    RAISE NOTICE 'Added resume_filename column';
  END IF;
  
  -- Add evaluation_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evaluations' AND column_name = 'evaluation_type') THEN
    ALTER TABLE evaluations ADD COLUMN evaluation_type TEXT DEFAULT 'interview' CHECK (evaluation_type IN ('resume', 'interview', 'combined'));
    RAISE NOTICE 'Added evaluation_type column';
  END IF;
  
  RAISE NOTICE 'Evaluations table column check completed!';
END $$; 