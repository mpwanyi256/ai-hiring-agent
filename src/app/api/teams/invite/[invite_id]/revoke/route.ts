import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: AppRequestParams<{ invite_id: string }>,
) {
  try {
    const { invite_id } = await params;

    if (!invite_id) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the current user to verify they have permission to revoke invitations
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // First, fetch the invite to verify it exists and belongs to the user's company
    const { data: invite, error: fetchError } = await supabase
      .from('invites')
      .select(
        `
        *,
        companies:company_id (
          name
        ),
        profiles:invited_by (
          first_name,
          last_name,
          email
        )
      `,
      )
      .eq('id', invite_id)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Check if the invite belongs to the user's company
    if (invite.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'You can only revoke invitations for your company' },
        { status: 403 },
      );
    }

    // Check if invite is still pending (can only revoke pending invitations)
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Can only revoke pending invitations' }, { status: 400 });
    }

    // Update invite status to revoked (we'll use 'rejected' status to indicate it was revoked)
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 });
    }

    // Log the revocation
    console.log(
      `Invite ${invite_id} revoked by ${profile.id} for ${invite.first_name} ${invite.last_name} (${invite.email})`,
    );

    return NextResponse.json({
      success: true,
      message: 'Invite revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
