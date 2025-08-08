-- Migration: Add missing contract analytics functions
-- This migration adds the missing functions for contract analytics

-- Create function to get popular contract job titles
CREATE OR REPLACE FUNCTION public.get_popular_contract_job_titles(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  job_title_id UUID,
  job_title_name TEXT,
  usage_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.job_title_id,
    jt.name::TEXT as job_title_name,
    COUNT(*)::BIGINT as usage_count
  FROM public.contracts c
  LEFT JOIN public.job_titles jt ON c.job_title_id = jt.id
  WHERE c.company_id = p_company_id 
    AND c.job_title_id IS NOT NULL
  GROUP BY c.job_title_id, jt.name
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$;

-- Create function to get popular contract employment types
CREATE OR REPLACE FUNCTION public.get_popular_contract_employment_types(
  p_company_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  employment_type_id UUID,
  employment_type_name TEXT,
  usage_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.employment_type_id,
    et.name::TEXT as employment_type_name,
    COUNT(*)::BIGINT as usage_count
  FROM public.contracts c
  LEFT JOIN public.employment_types et ON c.employment_type_id = et.id
  WHERE c.company_id = p_company_id 
    AND c.employment_type_id IS NOT NULL
  GROUP BY c.employment_type_id, et.name
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$;

-- Create missing candidate timeline events view
CREATE OR REPLACE VIEW public.candidate_timeline_events AS
SELECT 
  -- Interview events
  'interview-' || i.id AS id,
  'interview' AS type,
  CASE 
    WHEN i.status = 'completed' THEN 'Interview Completed'
    WHEN i.status = 'cancelled' THEN 'Interview Cancelled' 
    WHEN i.status = 'scheduled' THEN 'Interview Scheduled'
    ELSE 'Interview ' || INITCAP(i.status)
  END AS title,
  'Interview scheduled for ' || i.date || ' at ' || i.time AS description,
  i.created_at AS timestamp,
  CASE 
    WHEN i.status = 'completed' THEN 'success'
    WHEN i.status = 'cancelled' THEN 'error'
    ELSE 'info'
  END AS status,
  i.application_id AS candidate_id,
  jsonb_build_object(
    'interview_id', i.id,
    'date', i.date,
    'time', i.time,
    'notes', i.notes,
    'status', i.status,
    'job_id', i.job_id
  ) AS metadata,
  CASE 
    WHEN j.profile_id IS NOT NULL THEN jsonb_build_object(
      'name', p.first_name || ' ' || p.last_name,
      'role', 'Hiring Manager'
    )
    ELSE NULL
  END AS performer
FROM interviews i
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN profiles p ON j.profile_id = p.id

UNION ALL

SELECT 
  -- Contract offer events
  'contract-' || co.id AS id,
  'contract' AS type,
  CASE 
    WHEN co.status = 'signed' THEN 'Contract Signed'
    WHEN co.status = 'rejected' THEN 'Contract Rejected'
    WHEN co.status = 'sent' THEN 'Contract Sent'
    ELSE 'Contract Updated'
  END AS title,
  'Contract offer for ' || COALESCE(c.title, 'position') AS description,
  co.created_at AS timestamp,
  CASE 
    WHEN co.status = 'signed' THEN 'success'
    WHEN co.status = 'rejected' THEN 'error'
    ELSE 'info'
  END AS status,
  co.candidate_id,
  jsonb_build_object(
    'contract_id', co.id,
    'salary_amount', co.salary_amount,
    'salary_currency', co.salary_currency,
    'start_date', co.start_date,
    'contract_title', c.title,
    'contract_category', c.category,
    'rejection_reason', co.rejection_reason,
    'status', co.status
  ) AS metadata,
  CASE 
    WHEN p.id IS NOT NULL THEN jsonb_build_object(
      'name', p.first_name || ' ' || p.last_name,
      'role', 'HR Manager'
    )
    ELSE NULL
  END AS performer
FROM contract_offers co
LEFT JOIN contracts c ON co.contract_id = c.id
LEFT JOIN profiles p ON co.sent_by = p.id

UNION ALL

SELECT 
  -- Candidate status changes (from candidate_analytics if available)
  'status-' || c.id || '-' || extract(epoch from c.updated_at)::text AS id,
  'status_change' AS type,
  'Status Updated' AS title,
  'Candidate status changed to ' || c.status AS description,
  c.updated_at AS timestamp,
  CASE 
    WHEN c.status IN ('hired', 'offer_extended') THEN 'success'
    WHEN c.status IN ('rejected', 'withdrawn') THEN 'error'
    ELSE 'info'
  END AS status,
  c.id AS candidate_id,
  jsonb_build_object(
    'status', c.status,
    'candidate_id', c.id
  ) AS metadata,
  NULL AS performer
FROM candidates c
WHERE c.updated_at > c.created_at; -- Only show status changes, not initial creation

-- Grant permissions on new functions and views
GRANT EXECUTE ON FUNCTION public.get_popular_contract_job_titles(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_contract_employment_types(UUID, INTEGER) TO authenticated;
GRANT SELECT ON public.candidate_timeline_events TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_popular_contract_job_titles IS 'Returns most frequently used job titles in contracts for a company';
COMMENT ON FUNCTION public.get_popular_contract_employment_types IS 'Returns most frequently used employment types in contracts for a company';
COMMENT ON VIEW public.candidate_timeline_events IS 'Unified timeline view of candidate events including interviews, contracts, and status changes'; 