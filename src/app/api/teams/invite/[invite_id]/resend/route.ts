import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { integrations, app } from '@/lib/constants';

const resend = integrations.resend.apiKey ? new Resend(integrations.resend.apiKey) : null;

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

    // Get the current user to verify they have permission to resend invitations
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
        { error: 'You can only resend invitations for your company' },
        { status: 403 },
      );
    }

    // Check if invite is still pending (can only resend pending invitations)
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Can only resend pending invitations' }, { status: 400 });
    }

    // Check if invite has expired and extend it if necessary
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    const updateData: any = {
      updated_at: now.toISOString(),
    };

    // If expired or expiring soon (within 24 hours), extend expiration
    if (expiresAt <= now || expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      const newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      updateData.expires_at = newExpiresAt.toISOString();
    }

    // Update the invite with new expiration if needed
    const { error: updateError } = await supabase
      .from('invites')
      .update(updateData)
      .eq('id', invite_id);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 });
    }

    // Send the invitation email
    if (!resend) {
      return NextResponse.json({ error: 'Email service not available' }, { status: 500 });
    }

    const companyName = invite.companies?.name || 'the team';
    const inviteLink = `${app.baseUrl}/onboard/invite/${invite.id}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #386B43;">You're invited to join ${companyName}!</h2>
        <p>Hi ${invite.first_name},</p>
        <p>This is a reminder that you've been invited to join ${companyName} as a ${invite.role}.</p>
        <p><a href="${inviteLink}" style="background: #386B43; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Accept Invitation</a></p>
        <p style="margin-top: 30px; color: #999; font-size: 14px;">This link will expire in 30 days.</p>
        <p style="margin-top: 30px; color: #999; font-size: 14px;">Best regards,<br>The ${companyName} Team</p>
        <p style="margin-top: 30px; color: #999; font-size: 14px;">If you did not expect this invitation, you can ignore this email.</p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: `${app.name} <${app.email}>`,
      to: [invite.email],
      subject: `Reminder: You're invited to join ${companyName}!`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 });
    }

    // Log the resend
    console.log(
      `Invite ${invite_id} resent by ${profile.id} to ${invite.first_name} ${invite.last_name} (${invite.email})`,
    );

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
