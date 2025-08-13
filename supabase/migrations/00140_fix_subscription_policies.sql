-- 00140_fix_subscription_policies.sql
-- Restore public visibility for subscriptions and keep company-wide visibility for user_subscriptions

SET search_path = public;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions: revert to everyone can view (anon and authenticated)
DROP POLICY IF EXISTS "Anyone can view active subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Everyone can view subscriptions" ON public.subscriptions;
CREATE POLICY "Everyone can view subscriptions" ON public.subscriptions
  FOR SELECT
  USING (true);

-- Keep user_subscriptions visibility for company members intact (idempotent)
DROP POLICY IF EXISTS "Company members can view company subscription" ON public.user_subscriptions;
CREATE POLICY "Company members can view company subscription" ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p_owner
      WHERE p_owner.id = public.user_subscriptions.profile_id
        AND p_owner.company_id IN (
          SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    )
  );

-- Owner-only write rules (idempotent)
DROP POLICY IF EXISTS "Owners can manage their subscription linkages" ON public.user_subscriptions;
CREATE POLICY "Owners can manage their subscription linkages" ON public.user_subscriptions
  FOR ALL
  TO authenticated
  USING (public.user_subscriptions.profile_id = auth.uid())
  WITH CHECK (public.user_subscriptions.profile_id = auth.uid()); 