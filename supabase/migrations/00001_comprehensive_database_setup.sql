-- Comprehensive Database Setup Migration
-- This migration creates all essential tables, extensions, and core functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'employer' CHECK (role IN ('admin', 'employer', 'candidate')),
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  industry TEXT,
  size_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  continent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timezones table
CREATE TABLE IF NOT EXISTS timezones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  offset_hours INTEGER NOT NULL,
  offset_minutes INTEGER NOT NULL DEFAULT 0,
  is_dst BOOLEAN NOT NULL DEFAULT false,
  region TEXT NOT NULL,
  country_id UUID REFERENCES countries(id),
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  salary_range TEXT,
  employment_type TEXT DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed')),
  fields JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates_info table
CREATE TABLE IF NOT EXISTS candidates_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  additional_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_info_id UUID REFERENCES candidates_info(id) ON DELETE SET NULL,
  interview_token TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  candidate_status TEXT DEFAULT 'active' CHECK (candidate_status IN ('active', 'withdrawn', 'rejected', 'hired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  title TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  timezone_id UUID REFERENCES timezones(id),
  duration INTEGER NOT NULL DEFAULT 30,
  calendar_event_id TEXT,
  meet_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'linkedin')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, provider)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  max_jobs INTEGER DEFAULT 1,
  max_interviews_per_month INTEGER DEFAULT 5,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  trial_days INTEGER DEFAULT 30,
  interval TEXT DEFAULT 'month',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused', 'trialing', 'past_due', 'unpaid')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  recommendation TEXT,
  summary TEXT,
  feedback TEXT,
  strengths JSONB DEFAULT '[]',
  red_flags JSONB DEFAULT '[]',
  skills_assessment JSONB DEFAULT '{}',
  traits_assessment JSONB DEFAULT '{}',
  evaluation_type TEXT DEFAULT 'interview' CHECK (evaluation_type IN ('resume', 'interview', 'combined')),
  resume_score INTEGER DEFAULT 0,
  resume_summary TEXT,
  resume_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidate_resumes table
CREATE TABLE IF NOT EXISTS candidate_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  word_count INTEGER,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'completed', 'failed')),
  parsing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create traits table
CREATE TABLE IF NOT EXISTS traits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_templates table
CREATE TABLE IF NOT EXISTS job_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  template_data JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('employer', 'candidate', 'system')),
  sender_id UUID,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'notification')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'interview', 'application', 'system')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_permissions table
CREATE TABLE IF NOT EXISTS job_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  interview_reminders BOOLEAN DEFAULT TRUE,
  application_updates BOOLEAN DEFAULT TRUE,
  system_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Add foreign key constraint for profiles
ALTER TABLE profiles ADD CONSTRAINT profiles_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY; 