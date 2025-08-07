-- Fix Notifications Table and Views Migration
-- This migration fixes the notifications table structure and recreates related views and functions

-- ============================================================================
-- PART 1: Add missing columns to notifications table
-- ============================================================================

-- Add company_id column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Make company_id NOT NULL if it was just added
DO $$ BEGIN
    ALTER TABLE public.notifications ALTER COLUMN company_id SET NOT NULL;
EXCEPTION WHEN others THEN null; END $$;

-- ============================================================================
-- PART 2: Create missing indexes for notifications table
-- ============================================================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_company_created ON public.notifications(user_id, company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin ON public.notifications USING gin(metadata);

-- ============================================================================
-- PART 3: Enable RLS and create policies for notifications
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for users
CREATE POLICY "System can insert notifications for users" ON public.notifications
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- PART 4: Create functions for notifications
-- ============================================================================

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = ANY(notification_ids) 
    AND user_id = auth.uid()
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE user_id = auth.uid()
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 5: Recreate notifications_details view
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.notifications_details CASCADE;

-- Create updated notifications_details view that joins with the actual notifications table
CREATE OR REPLACE VIEW public.notifications_details AS
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
FROM public.notifications n
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
FROM public.contract_offers co
LEFT JOIN public.contracts c ON co.contract_id = c.id
-- Only include contract offers that don't have corresponding notification records
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n 
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
FROM public.interviews i
LEFT JOIN public.jobs j ON i.job_id = j.id
LEFT JOIN public.profiles p ON j.profile_id = p.id
-- Only include interviews that don't have corresponding notification records
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n 
  WHERE n.metadata->>'interview_id' = i.id::text
)

ORDER BY timestamp DESC;

-- ============================================================================
-- PART 6: Set security invoker and grant permissions
-- ============================================================================

-- Set security invoker for the view
ALTER VIEW public.notifications_details SET (security_invoker = on);

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_as_read(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications() TO authenticated;

-- ============================================================================
-- PART 7: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'User notifications table for tracking system notifications';
COMMENT ON COLUMN public.notifications.type IS 'Notification type: info, success, warning, error';
COMMENT ON COLUMN public.notifications.category IS 'Notification category: candidate, contract, interview, system, etc.';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN public.notifications.read_at IS 'When the notification was marked as read';
COMMENT ON COLUMN public.notifications.expires_at IS 'Optional expiration for temporary notifications';
COMMENT ON COLUMN public.notifications.related_entity_id IS 'ID of the related entity (job, candidate, etc.)';
COMMENT ON COLUMN public.notifications.related_entity_type IS 'Type of the related entity';

COMMENT ON VIEW public.notifications_details IS 'Unified view of all notifications including actual notification records and synthetic notifications from contract offers and interviews';
COMMENT ON COLUMN public.notifications_details.notification_id IS 'The actual notification record ID that can be used for updates - matches id for real notifications, synthetic for legacy ones';

COMMENT ON FUNCTION public.mark_notifications_as_read(UUID[]) IS 'Mark specified notifications as read for the current user';
COMMENT ON FUNCTION public.get_unread_notification_count() IS 'Get count of unread notifications for the current user';
COMMENT ON FUNCTION public.cleanup_expired_notifications() IS 'Clean up expired notifications and return count of deleted records';

-- ============================================================================
-- PART 8: Verify the migration was successful
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    view_exists BOOLEAN;
    function_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check column count
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND table_schema = 'public';
    
    -- Check if view exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'notifications_details' 
        AND table_schema = 'public'
    ) INTO view_exists;
    
    -- Check function count
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('mark_notifications_as_read', 'get_unread_notification_count', 'cleanup_expired_notifications');
    
    -- Check policy count
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'notifications' AND schemaname = 'public';
    
    -- Check index count
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'notifications' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Notifications table and views fixed successfully';
    RAISE NOTICE '  - Column count: %', column_count;
    RAISE NOTICE '  - View exists: %', view_exists;
    RAISE NOTICE '  - Functions created: %', function_count;
    RAISE NOTICE '  - Policies created: %', policy_count;
    RAISE NOTICE '  - Indexes created: %', index_count;
    RAISE NOTICE '  - Notifications system should now work correctly';
END $$; 