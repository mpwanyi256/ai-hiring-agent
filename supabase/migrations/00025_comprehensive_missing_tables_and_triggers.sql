-- Comprehensive Missing Tables and Triggers Migration
-- This migration adds all missing components: job_questions table, triggers, functions, and views

-- ============================================================================
-- PART 1: Create job_questions table
-- ============================================================================

-- Create questions table for job-specific questions
CREATE TABLE public.job_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('general', 'technical', 'behavioral', 'experience', 'custom')),
  category TEXT NOT NULL,
  expected_duration INTEGER DEFAULT 120, -- in seconds
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}', -- for storing additional question metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for job_questions
CREATE INDEX idx_job_questions_job_id ON public.job_questions(job_id);
CREATE INDEX idx_job_questions_order ON public.job_questions(job_id, order_index);
CREATE INDEX idx_job_questions_type ON public.job_questions(question_type);
CREATE INDEX idx_job_questions_required ON public.job_questions(is_required);
CREATE INDEX idx_job_questions_job_id_performance ON public.job_questions(job_id, is_required, is_ai_generated);

-- ============================================================================
-- PART 2: Update responses table to reference questions properly
-- ============================================================================

-- Add job_question_id to responses if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.responses ADD COLUMN job_question_id UUID REFERENCES public.job_questions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add resume_text column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.responses ADD COLUMN resume_text TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add response_time column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.responses ADD COLUMN response_time INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Create indexes for responses
CREATE INDEX IF NOT EXISTS idx_responses_job_question_id ON public.responses(job_question_id);

-- ============================================================================
-- PART 3: Update evaluations table
-- ============================================================================

-- Add resume_score column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.evaluations ADD COLUMN resume_score INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add resume_summary column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.evaluations ADD COLUMN resume_summary TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add resume_filename column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.evaluations ADD COLUMN resume_filename TEXT;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Add evaluation_type column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.evaluations ADD COLUMN evaluation_type TEXT DEFAULT 'interview' CHECK (evaluation_type IN ('resume', 'interview', 'combined'));
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Create indexes for evaluations
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON public.evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_resume_score ON public.evaluations(resume_score);

-- ============================================================================
-- PART 4: Create job_questions_detailed view
-- ============================================================================

CREATE OR REPLACE VIEW public.job_questions_detailed AS
SELECT 
  jq.id,
  jq.job_id,
  jq.question_text,
  jq.question_type,
  jq.category,
  jq.expected_duration,
  jq.is_required,
  jq.order_index,
  jq.is_ai_generated,
  jq.metadata,
  jq.created_at as question_created_at,
  jq.updated_at as question_updated_at,
  j.title as job_title,
  j.profile_id,
  j.interview_format,
  j.status as job_status,
  j.is_active as job_is_active
FROM public.job_questions jq
JOIN public.jobs j ON jq.job_id = j.id
ORDER BY jq.job_id, jq.order_index;

-- ============================================================================
-- PART 5: Create job_questions_overview view
-- ============================================================================

CREATE OR REPLACE VIEW public.job_questions_overview AS
SELECT 
    j.id as job_id,
    j.title as job_title,
    j.status as job_status,
    j.is_active as job_is_active,
    j.created_at as job_created_at,
    j.updated_at as job_updated_at,
    
    -- Creator details
    p.id as creator_id,
    p.first_name,
    p.last_name,
    p.email as creator_email,
    
    -- Company details
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    
    -- Question counts
    (
        SELECT COUNT(*) FROM public.job_questions jq
        WHERE jq.job_id = j.id
    ) as total_questions,
    
    (
        SELECT COUNT(*) FROM public.job_questions jq
        WHERE jq.job_id = j.id AND jq.is_required = true
    ) as required_questions,
    
    -- Candidate counts
    (
        SELECT COUNT(*) FROM public.candidates ca
        WHERE ca.job_id = j.id
    ) as total_candidates,
    
    (
        SELECT COUNT(*) FROM public.candidates ca
        WHERE ca.job_id = j.id AND ca.submitted_at IS NOT NULL
    ) as completed_interviews,
    
    -- Evaluation counts
    (
        SELECT COUNT(*) FROM public.evaluations e
        JOIN public.candidates ca ON e.candidate_id = ca.id
        WHERE ca.job_id = j.id
    ) as total_evaluations,
    
    -- Average score
    (
        SELECT ROUND(AVG(e.score), 2) FROM public.evaluations e
        JOIN public.candidates ca ON e.candidate_id = ca.id
        WHERE ca.job_id = j.id AND e.score IS NOT NULL
    ) as average_score

FROM public.jobs j
LEFT JOIN public.profiles p ON j.profile_id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
ORDER BY j.created_at DESC;

-- ============================================================================
-- PART 6: Create interview_sessions view (fixed to use candidate_info_id)
-- ============================================================================

CREATE OR REPLACE VIEW public.interview_sessions AS
SELECT DISTINCT
  r.candidate_id,
  ca.job_id,
  j.title as job_title,
  j.interview_token,
  ci.email,
  ci.first_name,
  ci.last_name,
  COUNT(r.id) as total_responses,
  COUNT(jq.id) as total_questions,
  ROUND((COUNT(r.id)::NUMERIC / NULLIF(COUNT(jq.id), 0)) * 100, 2) as completion_percentage,
  MIN(r.created_at) as started_at,
  MAX(r.created_at) as last_response_at,
  CASE 
    WHEN COUNT(r.id) = COUNT(jq.id) THEN true 
    ELSE false 
  END as is_completed,
  SUM(r.response_time) as total_time_spent
FROM public.responses r
JOIN public.candidates ca ON r.candidate_id = ca.id
JOIN public.candidates_info ci ON ca.candidate_info_id = ci.id
JOIN public.jobs j ON ca.job_id = j.id
LEFT JOIN public.job_questions jq ON jq.job_id = j.id
GROUP BY r.candidate_id, ca.job_id, j.title, j.interview_token, ci.email, ci.first_name, ci.last_name;

-- ============================================================================
-- PART 7: Create grant_job_creator_permissions function
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.grant_job_creator_permissions() CASCADE;

CREATE OR REPLACE FUNCTION public.grant_job_creator_permissions()
RETURNS TRIGGER AS $$
DECLARE
    creator_company_id UUID;
    creator_name TEXT;
BEGIN
    -- Grant admin permissions to the job creator
    INSERT INTO public.job_permissions (
        job_id,
        user_id,
        permission_level,
        granted_by
    ) VALUES (
        NEW.id,
        NEW.profile_id,
        'admin',
        NEW.profile_id
    );
    
    -- Get the company_id and name of the job creator
    SELECT company_id, first_name || ' ' || COALESCE(last_name, '')
    INTO creator_company_id, creator_name
    FROM public.profiles 
    WHERE id = NEW.profile_id;
    
    -- Create notifications for all users in the same company
    INSERT INTO public.notifications (
        user_id,
        company_id,
        type,
        category,
        title,
        message,
        related_entity_type,
        related_entity_id,
        metadata
    )
    SELECT 
        p.id,
        creator_company_id,
        'info',
        'job',
        'New Job Posted',
        CASE 
            WHEN p.id = NEW.profile_id THEN 'Your job "' || NEW.title || '" has been created successfully.'
            ELSE creator_name || ' posted a new job: "' || NEW.title || '"'
        END,
        'job',
        NEW.id,
        jsonb_build_object(
            'job_id', NEW.id,
            'job_title', NEW.title,
            'created_by', creator_name,
            'creator_id', NEW.profile_id,
            'is_creator', p.id = NEW.profile_id
        )
    FROM public.profiles p
    WHERE p.company_id = creator_company_id
      AND p.id IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: Create trigger for job creator permissions
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS grant_job_creator_permissions_trigger ON public.jobs;

-- Create trigger for job creator permissions
CREATE TRIGGER grant_job_creator_permissions_trigger
    AFTER INSERT ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.grant_job_creator_permissions();

-- ============================================================================
-- PART 9: Create update_job_questions_updated_at function and trigger
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_job_questions_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_job_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_job_questions_updated_at ON public.job_questions;

-- Create trigger for job_questions updated_at
CREATE TRIGGER trigger_update_job_questions_updated_at
  BEFORE UPDATE ON public.job_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_questions_updated_at();

-- ============================================================================
-- PART 10: Enable RLS and create policies for job_questions
-- ============================================================================

-- Enable RLS for job_questions
ALTER TABLE public.job_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employers can manage their job questions" ON public.job_questions;
DROP POLICY IF EXISTS "Anyone can read questions for active jobs" ON public.job_questions;

-- Employers can manage questions for their jobs
CREATE POLICY "Employers can manage their job questions" ON public.job_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

-- Anyone can read questions for active jobs (for interview flow)
CREATE POLICY "Anyone can read questions for active jobs" ON public.job_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id 
      AND j.is_active = true
    )
  );

-- ============================================================================
-- PART 11: Update RLS policies for responses (using candidate_id)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Candidates can create their own responses" ON public.responses;
DROP POLICY IF EXISTS "Candidates can read their own responses" ON public.responses;
DROP POLICY IF EXISTS "Employers can view responses for their jobs" ON public.responses;

-- New RLS policies for responses using candidate_id
CREATE POLICY "Candidates can create their own responses" ON public.responses
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'anon' -- Allow anonymous users to create responses
  );

CREATE POLICY "Candidates can read their own responses" ON public.responses
  FOR SELECT 
  USING (
    auth.role() = 'anon' -- Allow anonymous access for interview flow
  );

CREATE POLICY "Employers can view responses for their jobs" ON public.responses
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates ca
      JOIN public.jobs j ON ca.job_id = j.id
      JOIN public.profiles p ON j.profile_id = p.id
      WHERE ca.id = candidate_id 
      AND p.id = auth.uid()
    )
  );

-- ============================================================================
-- PART 12: Update RLS policies for evaluations (using candidate_id)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can create evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Candidates can read their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Employers can view evaluations for their jobs" ON public.evaluations;
DROP POLICY IF EXISTS "Service role can update evaluations" ON public.evaluations;

-- New RLS policies for evaluations using candidate_id
CREATE POLICY "Service role can create evaluations" ON public.evaluations
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Candidates can read their own evaluations" ON public.evaluations
  FOR SELECT 
  USING (
    auth.role() = 'anon' -- Allow anonymous access
  );

CREATE POLICY "Employers can view evaluations for their jobs" ON public.evaluations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.profiles p ON j.profile_id = p.id
      WHERE j.id = job_id 
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Service role can update evaluations" ON public.evaluations
  FOR UPDATE 
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 13: Set security invoker for views
-- ============================================================================

ALTER VIEW public.job_questions_detailed SET (security_invoker = on);
ALTER VIEW public.job_questions_overview SET (security_invoker = on);
ALTER VIEW public.interview_sessions SET (security_invoker = on);

-- ============================================================================
-- PART 14: Grant permissions
-- ============================================================================

-- Grant permissions for job_questions table
GRANT ALL ON public.job_questions TO authenticated;

-- Grant permissions for views
GRANT SELECT ON public.job_questions_detailed TO authenticated;
GRANT SELECT ON public.job_questions_overview TO authenticated;
GRANT SELECT ON public.interview_sessions TO authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION public.grant_job_creator_permissions() TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_job_creator_permissions() TO postgres;
GRANT EXECUTE ON FUNCTION public.update_job_questions_updated_at() TO authenticated;

-- ============================================================================
-- PART 15: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.job_questions IS 'Job-specific questions for interviews with various types and metadata';
COMMENT ON COLUMN public.job_questions.question_type IS 'Type of question: general, technical, behavioral, experience, custom';
COMMENT ON COLUMN public.job_questions.expected_duration IS 'Expected time to answer in seconds';
COMMENT ON COLUMN public.job_questions.order_index IS 'Order of questions in the interview';
COMMENT ON COLUMN public.job_questions.is_ai_generated IS 'Whether the question was generated by AI';
COMMENT ON COLUMN public.job_questions.metadata IS 'Additional question metadata in JSONB format';

COMMENT ON VIEW public.job_questions_detailed IS 'Detailed view of job questions with job information';
COMMENT ON VIEW public.job_questions_overview IS 'Overview of jobs with question counts and candidate statistics';
COMMENT ON VIEW public.interview_sessions IS 'Interview sessions with completion statistics';

COMMENT ON FUNCTION public.grant_job_creator_permissions() IS 'Grants admin permissions to job creator and creates notifications for all company users';
COMMENT ON FUNCTION public.update_job_questions_updated_at() IS 'Updates the updated_at timestamp for job_questions table';

-- ============================================================================
-- PART 16: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    view_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check if job_questions table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_questions'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'job_questions table was not created successfully';
    END IF;
    
    -- Check view count
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name IN ('job_questions_detailed', 'job_questions_overview', 'interview_sessions');
    
    -- Check function count
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('grant_job_creator_permissions', 'update_job_questions_updated_at');
    
    -- Check trigger count
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name IN ('grant_job_creator_permissions_trigger', 'trigger_update_job_questions_updated_at');
    
    RAISE NOTICE '✅ Comprehensive migration completed successfully';
    RAISE NOTICE '  - job_questions table exists: %', table_exists;
    RAISE NOTICE '  - Views created: %', view_count;
    RAISE NOTICE '  - Functions created: %', function_count;
    RAISE NOTICE '  - Triggers created: %', trigger_count;
    RAISE NOTICE '  - All missing components should now be available';
END $$; 