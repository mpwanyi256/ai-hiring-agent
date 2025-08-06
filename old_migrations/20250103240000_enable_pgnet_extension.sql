-- Enable pg_net extension for HTTP calls from database triggers
CREATE EXTENSION IF NOT EXISTS "pg_net" SCHEMA "extensions";

-- Add helpful comment
COMMENT ON EXTENSION pg_net IS 'Enables HTTP calls from PostgreSQL functions'; 