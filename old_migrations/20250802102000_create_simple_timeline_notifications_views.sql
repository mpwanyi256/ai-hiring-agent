-- Migration: Create Simplified Timeline and Notifications Views
-- Description: Create basic views for candidate timeline events and notifications

-- Create candidate_timeline_events view with only existing, reliable tables
CREATE OR REPLACE VIEW candidate_timeline_events AS
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
LEFT JOIN profiles p ON co.sent_by = p.id;

-- Drop the existing notifications_details view if it exists
DROP VIEW IF EXISTS notifications_details;

-- Create notifications_details view for legacy contract/interview notifications
CREATE VIEW notifications_details AS
SELECT 
  -- Contract offer notifications
  'contract-' || co.id AS id,
  'contract_offer' AS type,
  CASE 
    WHEN co.status = 'signed' THEN 'Contract Signed'
    WHEN co.status = 'rejected' THEN 'Contract Rejected'
    WHEN co.status = 'sent' THEN 'Contract Sent'
    ELSE 'Contract Updated'
  END AS title,
  CASE 
    WHEN co.status = 'signed' THEN 
      'Contract has been signed for ' || COALESCE(c.title, 'position')
    WHEN co.status = 'rejected' THEN 
      'Contract has been rejected' ||
      CASE WHEN co.rejection_reason IS NOT NULL THEN ': ' || co.rejection_reason ELSE '' END
    WHEN co.status = 'sent' THEN 
      'Contract sent for ' || COALESCE(c.title, 'position')
    ELSE 
      'Contract status updated'
  END AS message,
  co.updated_at AS timestamp,
  CASE 
    WHEN co.status = 'signed' THEN 'success'
    WHEN co.status = 'rejected' THEN 'error'
    WHEN co.status = 'sent' THEN 'info'
    ELSE 'warning'
  END AS status,
  false AS read,
  co.candidate_id AS user_id,
  -- Get company_id from the contract
  c.company_id,
  jsonb_build_object(
    'contract_offer_id', co.id,
    'contract_title', c.title,
    'salary_amount', co.salary_amount,
    'salary_currency', co.salary_currency,
    'status', co.status,
    'rejection_reason', co.rejection_reason
  ) AS metadata,
  'contract_offer' AS entity_type,
  co.id::text AS entity_id,
  NULL::VARCHAR(500) AS action_url,
  NULL::VARCHAR(100) AS action_text,
  NULL::TIMESTAMP WITH TIME ZONE AS read_at,
  NULL::TIMESTAMP WITH TIME ZONE AS expires_at,
  gen_random_uuid() AS notification_id
FROM contract_offers co
LEFT JOIN contracts c ON co.contract_id = c.id

UNION ALL

SELECT 
  -- Interview notifications
  'interview-' || i.id AS id,
  'interview' AS type,
  CASE 
    WHEN i.status = 'completed' THEN 'Interview Completed'
    WHEN i.status = 'cancelled' THEN 'Interview Cancelled'
    WHEN i.status = 'scheduled' THEN 'Interview Scheduled'
    ELSE 'Interview Updated'
  END AS title,
  CASE 
    WHEN i.status = 'completed' THEN 
      'Interview has been completed'
    WHEN i.status = 'cancelled' THEN 
      'Interview has been cancelled'
    WHEN i.status = 'scheduled' THEN 
      'Interview scheduled for ' || i.date || ' at ' || i.time
    ELSE 
      'Interview status updated'
  END AS message,
  i.updated_at AS timestamp,
  CASE 
    WHEN i.status = 'completed' THEN 'success'
    WHEN i.status = 'cancelled' THEN 'error'
    WHEN i.status = 'scheduled' THEN 'info'
    ELSE 'warning'
  END AS status,
  false AS read,
  i.application_id AS user_id,
  p.company_id,
  jsonb_build_object(
    'interview_id', i.id,
    'date', i.date,
    'time', i.time,
    'status', i.status,
    'job_id', i.job_id
  ) AS metadata,
  'interview' AS entity_type,
  i.id::text AS entity_id,
  NULL::VARCHAR(500) AS action_url,
  NULL::VARCHAR(100) AS action_text,
  NULL::TIMESTAMP WITH TIME ZONE AS read_at,
  NULL::TIMESTAMP WITH TIME ZONE AS expires_at,
  gen_random_uuid() AS notification_id
FROM interviews i
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN profiles p ON j.profile_id = p.id;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_created ON interviews(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_offers_candidate_created ON contract_offers(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_status_updated ON interviews(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_offers_status_updated ON contract_offers(status, updated_at DESC);

-- Grant permissions for the views
GRANT SELECT ON candidate_timeline_events TO authenticated;
GRANT SELECT ON notifications_details TO authenticated;
