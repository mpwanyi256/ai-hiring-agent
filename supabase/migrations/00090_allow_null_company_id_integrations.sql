-- Migration: Allow NULL company_id in integrations table
-- Users may not have a company when they first connect integrations

ALTER TABLE public.integrations 
  ALTER COLUMN company_id DROP NOT NULL; 