import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { EmailService, emailHelpers } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const { inviteId, status } = await request.json();

    if (!inviteId || !status) {
      return NextResponse.json({ error: 'Invite ID and status are required' }, { status: 400 });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be accepted or rejected' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Get inviter details
    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', invite.invited_by)
      .single();

    if (inviterError || !inviter) {
      return NextResponse.json({ error: 'Inviter not found' }, { status: 404 });
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', invite.company_id)
      .single();

    if (companyError) {
      console.warn('Company not found, using fallback name');
    }

    const inviteeName = emailHelpers.formatUserName(invite.first_name, invite.last_name);
    const inviterName = emailHelpers.formatUserName(inviter.first_name, inviter.last_name);
    const companyName = emailHelpers.getCompanyName(company?.name);

    let result;

    if (status === 'accepted') {
      // Send invite accepted notification
      const emailData = {
        inviterName,
        inviteeName,
        role: invite.role,
        companyName,
        teamUrl: emailHelpers.getTeamUrl(),
      };

      result = await EmailService.sendInviteAccepted(inviter.email, emailData);
    } else {
      // Send invite rejected notification
      const emailData = {
        inviterName,
        inviteeName,
        role: invite.role,
        companyName,
      };

      result = await EmailService.sendInviteRejected(inviter.email, emailData);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to send ${status} notification email`, details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Invite ${status} notification sent successfully`,
    });
  } catch (error) {
    console.error('Error sending invite status notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
