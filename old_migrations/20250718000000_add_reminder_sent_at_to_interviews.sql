-- Migration: Add reminder_sent_at column to interviews table for reminders
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN interviews.reminder_sent_at IS 'Timestamp when a reminder email was sent for the interview'; 