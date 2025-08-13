-- 00134_fix_team_invites_table_and_triggers.sql
-- Fix invites insertion defaults, ensure policies, and add activity logging triggers

SET search_path = public;

-- Ensure invites table exists with required columns
CREATE TABLE IF NOT EXISTS public.invites (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email TEXT NOT NULL,
	first_name TEXT,
	last_name TEXT,
	invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
	company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
	role TEXT NOT NULL DEFAULT 'employer' CHECK (role IN ('admin','employer','candidate')),
	expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
	token UUID DEFAULT gen_random_uuid() UNIQUE,
	created_at TIMESTAMPTZ DEFAULT NOW(),
	updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical fix: make invited_by default to the current authenticated user
ALTER TABLE public.invites
	ALTER COLUMN invited_by SET DEFAULT auth.uid();

-- Helpful indexes and unique constraint for pending invites per company/email
CREATE INDEX IF NOT EXISTS idx_invites_company_id ON public.invites(company_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON public.invites(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_invite_pending_per_company_email
ON public.invites(company_id, email)
WHERE status = 'pending';

-- Ensure RLS enabled
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Recreate policies (drop if exist to avoid conflicts), then define clear rules
DROP POLICY IF EXISTS "Company members can view their company invites" ON public.invites;
DROP POLICY IF EXISTS "Company admins can manage invites" ON public.invites;
DROP POLICY IF EXISTS "Invitation creators can view their invites" ON public.invites;
DROP POLICY IF EXISTS "Invitation creators can update their invites" ON public.invites;
DROP POLICY IF EXISTS "Invitation creators can delete their invites" ON public.invites;
DROP POLICY IF EXISTS "Anyone can view invites (public)" ON public.invites;

CREATE POLICY "Company members can view their company invites" ON public.invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = public.invites.company_id
    )
  );

CREATE POLICY "Company admins can manage invites" ON public.invites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = public.invites.company_id AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = public.invites.company_id AND p.role = 'admin'
    )
  );

-- Invitation creators can manage their own invites
CREATE POLICY "Invitation creators can view their invites" ON public.invites
  FOR SELECT TO authenticated
  USING (public.invites.invited_by = auth.uid());

CREATE POLICY "Invitation creators can update their invites" ON public.invites
  FOR UPDATE TO authenticated
  USING (public.invites.invited_by = auth.uid())
  WITH CHECK (public.invites.invited_by = auth.uid());

CREATE POLICY "Invitation creators can delete their invites" ON public.invites
  FOR DELETE TO authenticated
  USING (public.invites.invited_by = auth.uid());

-- Allow unauthenticated users to read invites (public access as previously configured)
CREATE POLICY "Anyone can view invites (public)" ON public.invites
  FOR SELECT TO anon
  USING (true);

-- Maintain updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invites_updated_at ON public.invites;
CREATE TRIGGER update_invites_updated_at
	BEFORE UPDATE ON public.invites
	FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-expire invites if past expiry when updated
CREATE OR REPLACE FUNCTION public.handle_invite_expiration()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.expires_at < NOW() AND NEW.status = 'pending' THEN
		NEW.status := 'expired';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_invite_expiration ON public.invites;
CREATE TRIGGER trigger_handle_invite_expiration
	BEFORE UPDATE ON public.invites
	FOR EACH ROW EXECUTE FUNCTION public.handle_invite_expiration();

-- Activity logging compatible with current user_activities schema
-- Expected schema: user_activities(user_id, company_id, activity_type, entity_type, entity_id, title, description, metadata, created_at, updated_at)

-- Log invite sent
CREATE OR REPLACE FUNCTION public.log_team_invite_sent()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO public.user_activities (
		user_id,
		company_id,
		activity_type,
		entity_type,
		entity_id,
		title,
		description,
		metadata
	) VALUES (
		NEW.invited_by,
		NEW.company_id,
		'team_invite_sent',
		'invite',
		NEW.id,
		'Team invitation sent',
		CONCAT('Invitation sent to ', NEW.email),
		jsonb_build_object(
			'invitee_email', NEW.email,
			'invitee_name', COALESCE(NEW.first_name,'') || CASE WHEN NEW.last_name IS NOT NULL THEN ' '||NEW.last_name ELSE '' END,
			'role', NEW.role,
			'expires_at', NEW.expires_at,
			'token', NEW.token
		)
	);
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_team_invite_sent ON public.invites;
CREATE TRIGGER trg_log_team_invite_sent
	AFTER INSERT ON public.invites
	FOR EACH ROW EXECUTE FUNCTION public.log_team_invite_sent();

-- Log invite accepted
CREATE OR REPLACE FUNCTION public.log_team_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
	IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
		INSERT INTO public.user_activities (
			user_id,
			company_id,
			activity_type,
			entity_type,
			entity_id,
			title,
			description,
			metadata
		) VALUES (
			NEW.invited_by,
			NEW.company_id,
			'team_invite_accepted',
			'invite',
			NEW.id,
			'Team invitation accepted',
			CONCAT('Invitation accepted by ', NEW.email),
			jsonb_build_object(
				'invitee_email', NEW.email,
				'role', NEW.role,
				'accepted_at', NOW()
			)
		);
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_team_invite_accepted ON public.invites;
CREATE TRIGGER trg_log_team_invite_accepted
	AFTER UPDATE ON public.invites
	FOR EACH ROW EXECUTE FUNCTION public.log_team_invite_accepted();

-- Log invite declined
CREATE OR REPLACE FUNCTION public.log_team_invite_declined()
RETURNS TRIGGER AS $$
BEGIN
	IF OLD.status = 'pending' AND NEW.status = 'declined' THEN
		INSERT INTO public.user_activities (
			user_id,
			company_id,
			activity_type,
			entity_type,
			entity_id,
			title,
			description,
			metadata
		) VALUES (
			NEW.invited_by,
			NEW.company_id,
			'team_invite_declined',
			'invite',
			NEW.id,
			'Team invitation declined',
			CONCAT('Invitation declined by ', NEW.email),
			jsonb_build_object(
				'invitee_email', NEW.email,
				'role', NEW.role,
				'declined_at', NOW()
			)
		);
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_team_invite_declined ON public.invites;
CREATE TRIGGER trg_log_team_invite_declined
	AFTER UPDATE ON public.invites
	FOR EACH ROW EXECUTE FUNCTION public.log_team_invite_declined();

-- Grants for functions (allow service role execution)
GRANT EXECUTE ON FUNCTION public.log_team_invite_sent() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_team_invite_accepted() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_team_invite_declined() TO service_role; 