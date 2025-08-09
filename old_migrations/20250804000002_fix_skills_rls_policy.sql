-- Migration: Fix RLS policies for skills and traits tables
-- This allows authenticated users to create company-specific skills and traits

-- Drop existing RLS policies for skills table
DROP POLICY IF EXISTS "Allow read access to skills" ON public.skills;
DROP POLICY IF EXISTS "Allow full access to skills for authenticated users" ON public.skills;

-- Create new RLS policies for skills table
CREATE POLICY "Allow read access to skills" ON public.skills
  FOR SELECT USING (
    is_active = true AND (
      company_id IS NULL OR 
      company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert for authenticated users" ON public.skills
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow update for company owners" ON public.skills
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow delete for company owners" ON public.skills
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Drop existing RLS policies for traits table
DROP POLICY IF EXISTS "Allow read access to traits" ON public.traits;
DROP POLICY IF EXISTS "Allow full access to traits for authenticated users" ON public.traits;

-- Create new RLS policies for traits table
CREATE POLICY "Allow read access to traits" ON public.traits
  FOR SELECT USING (
    is_active = true AND (
      company_id IS NULL OR 
      company_id IN (
        SELECT company_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow insert for authenticated users" ON public.traits
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow update for company owners" ON public.traits
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allow delete for company owners" ON public.traits
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  ); 