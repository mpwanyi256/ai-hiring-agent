-- Migration: Fix settings page issues - integrations table schema and company data access

-- Fix integrations table to match API expectations
-- Current API uses 'user_id' but table has 'profile_id'
-- Add missing fields from old migration

-- Drop existing integrations table constraints and recreate with proper schema
DROP TABLE IF EXISTS public.integrations CASCADE;

CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'linkedin', 'slack', 'discord')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_provider_company ON public.integrations(provider, company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON public.integrations(user_id, provider);

-- Enable Row Level Security
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Only the owning user or service role can read/write
CREATE POLICY "Integrations: User or Service Read/Write" ON public.integrations
  FOR ALL
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

-- Add missing columns to companies table for better settings support
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS logo_path TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS timezone_id UUID REFERENCES public.timezones(id);

-- Add missing columns to profiles table 
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update companies table to have better defaults
UPDATE public.companies 
SET bio = COALESCE(bio, description)
WHERE bio IS NULL AND description IS NOT NULL;

-- Create updated_at trigger for integrations
CREATE OR REPLACE FUNCTION public.update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_integrations_updated_at();

COMMENT ON TABLE public.integrations IS 'Third-party integrations for companies (Google Calendar, Slack, etc.)';
COMMENT ON COLUMN public.integrations.metadata IS 'Additional integration-specific data (email, name, etc.)'; 