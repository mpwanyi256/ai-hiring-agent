-- Initial setup for AI Hiring Agent database
-- This migration creates all the necessary tables and triggers for user authentication and subscription management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscriptions table (tiers that users can subscribe to)
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    max_jobs INTEGER DEFAULT 1,
    max_interviews_per_month INTEGER DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription tiers
INSERT INTO public.subscriptions (name, description, price_monthly, price_yearly, max_jobs, max_interviews_per_month, features) VALUES
('free', 'Free Tier', 0, 0, 1, 5, '["Basic reports", "Email support"]'::jsonb),
('pro', 'Pro Tier', 49, 490, 5, 50, '["Advanced AI scoring", "Export reports", "Priority support"]'::jsonb),
('business', 'Business Tier', 149, 1490, 999, 200, '["Unlimited jobs", "Async video", "Team collaboration", "API access"]'::jsonb),
('enterprise', 'Enterprise Tier', 999, 9990, 999, 999, '["Unlimited everything", "Custom AI models", "SLAs", "Onboarding support"]'::jsonb);

-- Create companies table
CREATE TABLE public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (replaces employers table)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subscription_id)
);

-- Create jobs table (updated to reference profiles instead of employers)
CREATE TABLE public.jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    fields JSONB DEFAULT '{}'::jsonb,
    interview_format VARCHAR(10) DEFAULT 'text' CHECK (interview_format IN ('text', 'video')),
    interview_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE public.candidates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    interview_token VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create responses table
CREATE TABLE public.responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE public.evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    summary TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
    red_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_jobs_profile_id ON public.jobs(profile_id);
CREATE INDEX idx_jobs_interview_token ON public.jobs(interview_token);
CREATE INDEX idx_candidates_job_id ON public.candidates(job_id);
CREATE INDEX idx_candidates_interview_token ON public.candidates(interview_token);
CREATE INDEX idx_responses_candidate_id ON public.responses(candidate_id);
CREATE INDEX idx_evaluations_candidate_id ON public.evaluations(candidate_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Function to generate company slug from name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'company';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    company_data JSONB;
    company_name TEXT;
    existing_company_id UUID;
    new_company_id UUID;
    free_subscription_id UUID;
BEGIN
    -- Extract company name from user metadata
    company_data := NEW.raw_user_meta_data;
    company_name := company_data->>'company_name';
    
    -- Check if company name was provided
    IF company_name IS NULL OR company_name = '' THEN
        RAISE EXCEPTION 'Company name is required in user metadata';
    END IF;
    
    -- Check if company already exists (case-insensitive)
    SELECT id INTO existing_company_id 
    FROM public.companies 
    WHERE lower(name) = lower(company_name);
    
    -- If company doesn't exist, create it
    IF existing_company_id IS NULL THEN
        INSERT INTO public.companies (name, slug)
        VALUES (company_name, generate_company_slug(company_name))
        RETURNING id INTO new_company_id;
        
        existing_company_id := new_company_id;
    END IF;
    
    -- Create user profile
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        company_id
    ) VALUES (
        NEW.id,
        NEW.email,
        company_data->>'first_name',
        company_data->>'last_name',
        existing_company_id
    );
    
    -- Get free subscription ID
    SELECT id INTO free_subscription_id 
    FROM public.subscriptions 
    WHERE name = 'free' AND is_active = true;
    
    -- Subscribe user to free tier
    IF free_subscription_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (
            user_id,
            subscription_id,
            status
        ) VALUES (
            NEW.id,
            free_subscription_id,
            'active'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON public.evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for companies (users can view companies they belong to)
CREATE POLICY "Users can view their company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- RLS Policies for jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs
    FOR ALL USING (profile_id = auth.uid());

-- RLS Policies for candidates (users can view candidates for their jobs)
CREATE POLICY "Users can view candidates for their jobs" ON public.candidates
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM public.jobs WHERE profile_id = auth.uid()
        )
    );

-- RLS Policies for responses (users can view responses for their job candidates)
CREATE POLICY "Users can view responses for their job candidates" ON public.responses
    FOR SELECT USING (
        candidate_id IN (
            SELECT c.id FROM public.candidates c
            JOIN public.jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        )
    );

-- RLS Policies for evaluations
CREATE POLICY "Users can view evaluations for their job candidates" ON public.evaluations
    FOR ALL USING (
        candidate_id IN (
            SELECT c.id FROM public.candidates c
            JOIN public.jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        )
    );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for subscriptions (everyone can view available subscription plans)
CREATE POLICY "Everyone can view subscription plans" ON public.subscriptions
    FOR SELECT USING (is_active = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anonymous users to view subscription plans and create candidates/responses (for interview flow)
GRANT SELECT ON public.subscriptions TO anon;
GRANT INSERT ON public.candidates TO anon;
GRANT INSERT ON public.responses TO anon;
GRANT SELECT ON public.jobs TO anon; 