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

    // First, fetch the invite to get inviter details for notification
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

    // Check if invite is still pending
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite has already been processed' }, { status: 400 });
    }

    // Update invite status to rejected
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject invite' }, { status: 500 });
    }

    // TODO: Send notification email to inviter
    // This can be implemented later using Resend API
    console.log(
      `Invite ${invite_id} rejected by ${invite.first_name} ${invite.last_name} (${invite.email})`,
    );

    return NextResponse.json({
      success: true,
      message: 'Invite rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
