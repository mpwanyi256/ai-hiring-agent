-- Migration: Update notifications view to include actual notification record IDs
-- Description: Modify the notifications_details view to include the actual notification_id from the notifications table

-- Drop the existing view first
DROP VIEW IF EXISTS notifications_details;

-- Create updated notifications_details view that joins with the actual notifications table
CREATE OR REPLACE VIEW notifications_details AS
SELECT 
  -- Use actual notification ID from notifications table (convert to text for UNION compatibility)
  n.id::text AS id,
  n.type,
  n.title,
  n.message,
  n.created_at AS timestamp,
  CASE 
    WHEN n.type = 'success' THEN 'success'
    WHEN n.type = 'error' THEN 'error'
    WHEN n.type = 'warning' THEN 'warning'
    ELSE 'info'
  END AS status,
  n.is_read AS read,
  n.user_id,
  n.company_id,
  n.metadata,
  n.category AS entity_type,
  COALESCE(n.metadata->>'entity_id', '') AS entity_id,
  n.action_url,
  n.action_text,
  n.read_at,
  n.expires_at,
  -- Add notification_id as a separate field for easy reference (keep as UUID for updates)
  n.id AS notification_id
FROM notifications n
WHERE n.expires_at IS NULL OR n.expires_at > NOW()

UNION ALL

-- Keep the synthetic notifications from contract offers for backward compatibility
-- but now we'll create actual notification records for these via triggers
SELECT 
  -- Use synthetic ID for contract offer notifications that don't have notification records yet
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
  co.sent_by AS user_id,
  c.company_id,
  jsonb_build_object(
    'contract_offer_id', co.id,
    'contract_title', c.title,
    'candidate_id', co.candidate_id,
    'status', co.status,
    'rejection_reason', co.rejection_reason,
    'entity_id', co.id::text
  ) AS metadata,
  'contract_offer' AS entity_type,
  co.id::text AS entity_id,
  '/dashboard/contracts/' || c.id AS action_url,
  'View Contract' AS action_text,
  NULL AS read_at,
  NULL AS expires_at,
  -- For synthetic notifications, use NULL since there's no real notification record
  NULL::uuid AS notification_id
FROM contract_offers co
LEFT JOIN contracts c ON co.contract_id = c.id
-- Only include contract offers that don't have corresponding notification records
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.metadata->>'contract_offer_id' = co.id::text
)

UNION ALL

-- Keep the synthetic notifications from interviews for backward compatibility
SELECT 
  -- Use synthetic ID for interview notifications that don't have notification records yet
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
  j.profile_id AS user_id,
  p.company_id,
  jsonb_build_object(
    'interview_id', i.id,
    'date', i.date,
    'time', i.time,
    'status', i.status,
    'job_id', i.job_id,
    'candidate_id', i.application_id,
    'entity_id', i.id::text
  ) AS metadata,
  'interview' AS entity_type,
  i.id::text AS entity_id,
  '/dashboard/jobs/' || j.id AS action_url,
  'View Job' AS action_text,
  NULL AS read_at,
  NULL AS expires_at,
  -- For synthetic notifications, use NULL since there's no real notification record
  NULL::uuid AS notification_id
FROM interviews i
LEFT JOIN jobs j ON i.job_id = j.id
LEFT JOIN profiles p ON j.profile_id = p.id
-- Only include interviews that don't have corresponding notification records
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.metadata->>'interview_id' = i.id::text
)

ORDER BY timestamp DESC;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_company_created ON notifications(user_id, company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin ON notifications USING gin(metadata);

-- Add comments for documentation
COMMENT ON VIEW notifications_details IS 'Unified view of all notifications including actual notification records and synthetic notifications from contract offers and interviews';
COMMENT ON COLUMN notifications_details.notification_id IS 'The actual notification record ID that can be used for updates - matches id for real notifications, synthetic for legacy ones';

-- Add security invoker
ALTER VIEW public.notifications_details SET (security_invoker = on);
GRANT SELECT ON public.notifications_details TO authenticated;
