-- Migration: Create invites table for team invitations
CREATE TABLE IF NOT EXISTS public.invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    first_name text,
    last_name text,
    invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status text NOT NULL,
    role text NOT NULL,
    expires_at timestamp,
    created_at timestamp DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_invites_company_id ON public.invites(company_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);

-- Unique pending invite per company/email
CREATE UNIQUE INDEX IF NOT EXISTS uniq_invite_pending_per_company_email
ON public.invites(company_id, email)
WHERE status = 'pending'; 


-- Add auth policies
CREATE POLICY "Enable read access for all users" ON public.invites FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.invites FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable update access for authenticated users" ON public.invites FOR UPDATE USING (auth.uid() = invited_by);
CREATE POLICY "Enable delete access for authenticated users" ON public.invites FOR DELETE USING (auth.uid() = invited_by);