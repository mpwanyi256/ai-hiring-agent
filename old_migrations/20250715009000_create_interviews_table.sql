-- Drop interview_schedules table
DROP TABLE IF EXISTS interview_schedules;
DROP VIEW IF EXISTS interview_sessions;

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  timezone_id UUID, -- Will be added as foreign key after timezones table exists
  duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  calendar_event_id TEXT,
  meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_timezone_id ON interviews(timezone_id);
CREATE INDEX IF NOT EXISTS idx_interviews_calendar_event_id ON interviews(calendar_event_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_interviews_application_job ON interviews(application_id, job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_status ON interviews(job_id, status);
CREATE INDEX IF NOT EXISTS idx_interviews_date_status ON interviews(date, status);

-- Enable Row Level Security
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see interviews for their own jobs
CREATE POLICY "Users can view interviews for their jobs" ON interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Users can create interviews for their jobs
CREATE POLICY "Users can create interviews for their jobs" ON interviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Users can update interviews for their jobs
CREATE POLICY "Users can update interviews for their jobs" ON interviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Users can delete interviews for their jobs
CREATE POLICY "Users can delete interviews for their jobs" ON interviews
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = interviews.job_id 
      AND jobs.profile_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_interviews_updated_at();

-- Create function to validate interview scheduling
CREATE OR REPLACE FUNCTION validate_interview_scheduling()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if interview is in the future
  IF (NEW.date || ' ' || NEW.time)::timestamp <= NOW() THEN
    RAISE EXCEPTION 'Interview must be scheduled for a future date and time';
  END IF;
  
  -- Check if duration is reasonable (between 15 minutes and 4 hours)
  IF NEW.duration < 15 OR NEW.duration > 240 THEN
    RAISE EXCEPTION 'Interview duration must be between 15 minutes and 4 hours';
  END IF;
  
  -- Check for conflicting interviews (same candidate, same date, overlapping times)
  IF EXISTS (
    SELECT 1 FROM interviews 
    WHERE application_id = NEW.application_id 
    AND date = NEW.date 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    AND status IN ('scheduled', 'confirmed')
    AND (
      (time <= NEW.time AND time + (duration || ' minutes')::interval > NEW.time) OR
      (NEW.time <= time AND NEW.time + (NEW.duration || ' minutes')::interval > time)
    )
  ) THEN
    RAISE EXCEPTION 'Conflicting interview already scheduled for this candidate at this time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate interview scheduling
CREATE TRIGGER validate_interview_scheduling
  BEFORE INSERT OR UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION validate_interview_scheduling();

-- Add comments to the table and columns
COMMENT ON TABLE interviews IS 'Stores scheduled interviews between candidates and employers';
COMMENT ON COLUMN interviews.application_id IS 'Reference to the candidate application (candidates.id)';
COMMENT ON COLUMN interviews.job_id IS 'Reference to the job posting (jobs.id)';
COMMENT ON COLUMN interviews.date IS 'Interview date (YYYY-MM-DD)';
COMMENT ON COLUMN interviews.time IS 'Interview time (HH:MM)';
COMMENT ON COLUMN interviews.timezone_id IS 'Reference to timezone (timezones.id) - will be added as foreign key after timezones table exists';
COMMENT ON COLUMN interviews.duration IS 'Interview duration in minutes';
COMMENT ON COLUMN interviews.calendar_event_id IS 'Google Calendar event ID (for future integration)';
COMMENT ON COLUMN interviews.meet_link IS 'Video meeting link (for future integration)';
COMMENT ON COLUMN interviews.status IS 'Interview status: scheduled, confirmed, completed, cancelled, no_show, rescheduled';
COMMENT ON COLUMN interviews.notes IS 'Additional notes or instructions for the interview'; 