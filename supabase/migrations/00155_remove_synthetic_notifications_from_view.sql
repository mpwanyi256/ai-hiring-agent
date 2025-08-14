-- 00155_remove_synthetic_notifications_from_view.sql
-- Remove synthetic rows from notifications_details; only return persisted notifications

SET search_path = public;

DROP VIEW IF EXISTS public.notifications_details CASCADE;

CREATE OR REPLACE VIEW public.notifications_details AS
SELECT 
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
  n.id AS notification_id
FROM public.notifications n
WHERE n.expires_at IS NULL OR n.expires_at > NOW()
ORDER BY timestamp DESC;

ALTER VIEW public.notifications_details SET (security_invoker = on);
GRANT SELECT ON public.notifications_details TO authenticated;


