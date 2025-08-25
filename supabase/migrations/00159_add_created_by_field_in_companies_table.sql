-- Add created_by field in companies table with a default to auth.users.id
ALTER TABLE companies ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
