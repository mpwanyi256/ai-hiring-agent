-- DROP COLUMN question_type from responses table
ALTER TABLE responses DROP COLUMN question_type;

-- Add question column to responses table
ALTER TABLE responses ADD COLUMN question TEXT DEFAULT NULL;