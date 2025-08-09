-- Migration: Fix RLS policies for candidate_analytics table
-- This migration adds the missing INSERT and UPDATE policies that are needed for the analytics system to work properly

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view candidate analytics for their jobs" ON candidate_analytics;
DROP POLICY IF EXISTS "Users can view response analytics for their jobs" ON candidate_response_analytics;

-- Recreate SELECT policy for candidate_analytics with proper permissions
CREATE POLICY "Users can view candidate analytics for their jobs" ON candidate_analytics
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs WHERE profile_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- Add INSERT policy for candidate_analytics to allow system functions to create analytics
CREATE POLICY "System can insert candidate analytics" ON candidate_analytics
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        -- Allow inserts from authenticated users for their jobs
        job_id IN (
            SELECT id FROM jobs WHERE profile_id = auth.uid()
        )
    );

-- Add UPDATE policy for candidate_analytics to allow system functions to update analytics
CREATE POLICY "System can update candidate analytics" ON candidate_analytics
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        -- Allow updates from authenticated users for their jobs
        job_id IN (
            SELECT id FROM jobs WHERE profile_id = auth.uid()
        )
    );

-- Recreate SELECT policy for candidate_response_analytics with proper permissions
CREATE POLICY "Users can view response analytics for their jobs" ON candidate_response_analytics
    FOR SELECT USING (
        candidate_id IN (
            SELECT c.id FROM candidates c
            JOIN jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- Add INSERT policy for candidate_response_analytics
CREATE POLICY "System can insert response analytics" ON candidate_response_analytics
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        -- Allow inserts from authenticated users for their job candidates
        candidate_id IN (
            SELECT c.id FROM candidates c
            JOIN jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        )
    );

-- Add UPDATE policy for candidate_response_analytics
CREATE POLICY "System can update response analytics" ON candidate_response_analytics
    FOR UPDATE USING (
        auth.role() = 'service_role' OR
        -- Allow updates from authenticated users for their job candidates
        candidate_id IN (
            SELECT c.id FROM candidates c
            JOIN jobs j ON c.job_id = j.id
            WHERE j.profile_id = auth.uid()
        )
    );

-- Grant necessary permissions to service_role for analytics functions
GRANT ALL ON candidate_analytics TO service_role;
GRANT ALL ON candidate_response_analytics TO service_role;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON candidate_analytics TO authenticated;
GRANT SELECT ON candidate_response_analytics TO authenticated;

-- Add helpful comments
COMMENT ON TABLE candidate_analytics IS 'Analytics data for candidates with comprehensive metrics and scoring';
COMMENT ON TABLE candidate_response_analytics IS 'Detailed analytics for individual candidate responses';

COMMENT ON COLUMN candidate_analytics.engagement_level IS 'Candidate engagement level: low, medium, high';
COMMENT ON COLUMN candidate_analytics.ai_recommendation IS 'AI recommendation: strong_yes, yes, maybe, no, strong_no';
COMMENT ON COLUMN candidate_analytics.red_flags IS 'Array of potential red flags identified by AI analysis'; 