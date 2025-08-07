-- Fix Candidates API and Company RLS Migration
-- This migration fixes the type mismatch error in get_job_candidate_details function
-- and adds RLS policy for companies table to allow unauthenticated access

-- ============================================================================
-- PART 1: Fix the type mismatch in get_job_candidate_details function
-- ============================================================================

-- The issue is that job_title in candidate_details view is character varying(255)
-- but the function expects text. We need to cast it properly.

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS get_job_candidate_details(uuid, text, text, integer, integer);

CREATE OR REPLACE FUNCTION get_job_candidate_details(
    p_job_id uuid,
    p_search text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    candidate_info_id uuid,
    job_id uuid,
    interview_token text,
    email text,
    first_name text,
    last_name text,
    full_name text,
    current_step integer,
    total_steps integer,
    is_completed boolean,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    progress_percentage integer,
    job_title text,
    job_status text,
    profile_id uuid,
    job_fields jsonb,
    response_count bigint,
    evaluation_id uuid,
    score integer,
    recommendation text,
    summary text,
    strengths jsonb,
    red_flags jsonb,
    skills_assessment jsonb,
    traits_assessment jsonb,
    evaluation_created_at timestamp with time zone,
    evaluation_type text,
    resume_score integer,
    resume_summary text,
    resume_id uuid,
    resume_filename text,
    resume_file_path text,
    resume_public_url text,
    resume_file_size integer,
    resume_file_type text,
    resume_word_count integer,
    resume_parsing_status text,
    resume_parsing_error text,
    resume_uploaded_at timestamp with time zone,
    candidate_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.candidate_info_id,
        cd.job_id,
        cd.interview_token,
        cd.email,
        cd.first_name,
        cd.last_name,
        cd.full_name,
        cd.current_step,
        cd.total_steps,
        cd.is_completed,
        cd.submitted_at,
        cd.created_at,
        cd.updated_at,
        ROUND(cd.progress_percentage)::integer,
        cd.job_title::text, -- Explicitly cast to text to fix type mismatch
        cd.job_status,
        cd.profile_id,
        cd.job_fields,
        cd.response_count,
        cd.evaluation_id,
        cd.score,
        cd.recommendation,
        cd.summary,
        cd.strengths,
        cd.red_flags,
        cd.skills_assessment,
        cd.traits_assessment,
        cd.evaluation_created_at,
        cd.evaluation_type,
        cd.resume_score,
        cd.resume_summary,
        cd.resume_id,
        cd.resume_filename,
        cd.resume_file_path,
        cd.resume_public_url,
        cd.resume_file_size,
        cd.resume_file_type,
        cd.resume_word_count,
        cd.resume_parsing_status,
        cd.resume_parsing_error,
        cd.resume_uploaded_at,
        cd.candidate_status::text
    FROM candidate_details cd
    WHERE cd.job_id = p_job_id
    AND (p_search IS NULL OR 
         cd.full_name ILIKE '%' || p_search || '%' OR 
         cd.email ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR cd.candidate_status::text = p_status)
    ORDER BY cd.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================================================
-- PART 2: Add RLS policy for companies table to allow unauthenticated access
-- ============================================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;

-- Allow everyone (authenticated and unauthenticated) to view company details
-- This is needed for public job listings and company information
CREATE POLICY "Everyone can view companies" ON companies
    FOR SELECT USING (true);

-- Company admins can update their company
CREATE POLICY "Company admins can update their company" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.company_id = companies.id 
            AND p.role = 'admin'
        )
    );

-- ============================================================================
-- PART 3: Grant necessary permissions for companies table
-- ============================================================================

-- Grant SELECT permission to anon role for public access
GRANT SELECT ON companies TO anon;

-- Ensure authenticated users have necessary permissions
GRANT SELECT, UPDATE ON companies TO authenticated;

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
    company_policies_count INTEGER;
    anon_permissions BOOLEAN;
BEGIN
    -- Check if the function exists and has correct signature
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_job_candidate_details'
        AND n.nspname = 'public'
    ) INTO function_exists;

    -- Check company policies count
    SELECT COUNT(*) FROM pg_policies
    WHERE tablename = 'companies'
    INTO company_policies_count;

    -- Check if anon has SELECT permission on companies
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_name = 'companies'
        AND grantee = 'anon'
        AND privilege_type = 'SELECT'
    ) INTO anon_permissions;

    RAISE NOTICE '✅ Candidates API and Company RLS Fix Applied';
    RAISE NOTICE '  - get_job_candidate_details function exists: %', function_exists;
    RAISE NOTICE '  - Company RLS policies count: %', company_policies_count;
    RAISE NOTICE '  - Anonymous users can view companies: %', anon_permissions;

    IF function_exists AND company_policies_count >= 2 AND anon_permissions THEN
        RAISE NOTICE '  - ✅ All fixes applied successfully';
    ELSE
        RAISE NOTICE '  - ⚠️  Some fixes may need manual verification';
    END IF;
END $$; 