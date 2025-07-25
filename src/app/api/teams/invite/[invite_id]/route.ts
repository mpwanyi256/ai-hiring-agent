import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: AppRequestParams<{ invite_id: string }>,
) {
  try {
    const { invite_id } = await params;

    if (!invite_id) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch invite with company and inviter details
    const { data: invite, error } = await supabase
      .from('invites')
      .select(
        `
        *,
        companies:company_id (
          name
        ),
        profiles:invited_by (
          first_name,
          last_name
        )
      `,
      )
      .eq('id', invite_id)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Format response
    const inviteData = {
      id: invite.id,
      email: invite.email,
      first_name: invite.first_name,
      last_name: invite.last_name,
      role: invite.role,
      status: invite.status,
      expires_at: invite.expires_at,
      company_name: invite.companies?.name || 'Unknown Company',
      invited_by_name: invite.profiles
        ? `${invite.profiles.first_name} ${invite.profiles.last_name}`.trim()
        : 'Someone',
    };

    return NextResponse.json({ invite: inviteData });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
