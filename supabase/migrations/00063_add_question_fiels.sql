-- Add question_type field to responses table
ALTER TABLE responses ADD COLUMN question_type TEXT DEFAULT NULL;