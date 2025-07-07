-- Create interview type enum
CREATE TYPE interview_type AS ENUM ('video', 'phone', 'in_person');

-- Create interview schedule status enum
CREATE TYPE interview_schedule_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- Create interview_schedules table
CREATE TABLE interview_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  interview_type interview_type NOT NULL,
  location TEXT,
  notes TEXT,
  status interview_schedule_status NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_interview_schedules_candidate_id ON interview_schedules(candidate_id);
CREATE INDEX idx_interview_schedules_job_id ON interview_schedules(job_id);
CREATE INDEX idx_interview_schedules_scheduled_date ON interview_schedules(scheduled_date);
CREATE INDEX idx_interview_schedules_status ON interview_schedules(status);
CREATE INDEX idx_interview_schedules_created_by ON interview_schedules(created_by);

-- Enable RLS
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see interview schedules for their own jobs
CREATE POLICY "Users can view interview schedules for their jobs" ON interview_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interview_schedules.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Users can create interview schedules for their jobs
CREATE POLICY "Users can create interview schedules for their jobs" ON interview_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interview_schedules.job_id 
      AND jobs.profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- Users can update interview schedules for their jobs
CREATE POLICY "Users can update interview schedules for their jobs" ON interview_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interview_schedules.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Users can delete interview schedules for their jobs
CREATE POLICY "Users can delete interview schedules for their jobs" ON interview_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interview_schedules.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_schedules_updated_at 
  BEFORE UPDATE ON interview_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 