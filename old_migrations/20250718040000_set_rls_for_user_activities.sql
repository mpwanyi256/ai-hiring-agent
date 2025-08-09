-- Enable Row Level Security on user_activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint to user_activities.user_id referencing profiles(id) ON DELETE CASCADE
ALTER TABLE public.user_activities
ADD CONSTRAINT fk_user_activities_user_id
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Policy: All loggedin users can view activities for their own company
CREATE POLICY "Users can view their company activities" ON public.user_activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid() AND p2.id = user_id AND p1.company_id = p2.company_id
  )
);

-- Policy: Service role full access
CREATE POLICY "Service role full access" ON public.user_activities
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create a view that resolves user activities with company info
CREATE OR REPLACE VIEW public.user_activities_resolved AS
SELECT
  ua.id,
  ua.user_id,
  ua.event_type,
  ua.entity_id,
  ua.entity_type,
  ua.message,
  ua.meta,
  ua.created_at,
  p.company_id,
  c.name AS company_name
FROM user_activities ua
JOIN profiles p ON ua.user_id = p.id
JOIN companies c ON p.company_id = c.id; 

-- Set Security Invokers
ALTER VIEW public.user_activities_resolved SET (security_invoker = on);

-- Grant access to authenticated users
GRANT SELECT ON public.user_activities_resolved TO authenticated;
