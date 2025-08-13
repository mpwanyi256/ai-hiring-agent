-- 00139_profiles_and_subscriptions_rls.sql
-- RLS: allow company members to view other members' profiles; allow company members to view company subscription

SET search_path = public;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Company members can view fellow members' profiles
DROP POLICY IF EXISTS "Company members can view company profiles" ON public.profiles;
CREATE POLICY "Company members can view company profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Company members can view company subscription via user_subscriptions
-- We expose rows in user_subscriptions for anyone in the same company as the owner profile
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

-- Strict owner-only modification of user_subscriptions
DROP POLICY IF EXISTS "Owners can manage their subscription linkages" ON public.user_subscriptions;
CREATE POLICY "Owners can manage their subscription linkages" ON public.user_subscriptions
  FOR ALL
  TO authenticated
  USING (public.user_subscriptions.profile_id = auth.uid())
  WITH CHECK (public.user_subscriptions.profile_id = auth.uid());

-- For catalog of subscription plans (public metadata), retain existing policies; ensure read access if needed
DROP POLICY IF EXISTS "Anyone can view active subscriptions" ON public.subscriptions;
CREATE POLICY "Anyone can view active subscriptions" ON public.subscriptions
  FOR SELECT
  USING (is_active = true);

-- Admins can view all subscriptions (including inactive)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

-- Notes:
-- - We do not grant UPDATE/DELETE on subscriptions table to general users; it's admin-managed elsewhere.
-- - Invited members will now be able to see the company’s user_subscriptions rows and thus active billing status.

-- Verification (read-only examples):
-- SELECT * FROM public.profiles p_other WHERE EXISTS (
--   SELECT 1 FROM public.profiles p_self WHERE p_self.id = auth.uid() AND p_self.company_id = p_other.company_id
-- );
-- SELECT us.* FROM public.user_subscriptions us
-- JOIN public.profiles p ON p.id = us.profile_id
-- WHERE p.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()); 