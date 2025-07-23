import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { integrations, app } from '@/lib/constants';

const resend = integrations.resend.apiKey ? new Resend(integrations.resend.apiKey) : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, companyId, role, companyName } = body;
    if (!email || !firstName || !lastName || !companyId || !role) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Check if user exists and is attached to a different company
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id, email, company_id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.log('Error checking for existing user:', userError);
    }

    if (existingUser && existingUser.company_id !== companyId) {
      return NextResponse.json(
        { error: 'This user is already registered with a different company.' },
        { status: 409 },
      );
    }

    // 2. Check for existing pending invite for this email and company
    const { data: existingInvite, error: inviteError } = await supabase
      .from('invites')
      .select('id, status')
      .eq('email', email)
      .eq('company_id', companyId)
      .maybeSingle();

    if (inviteError) {
      console.log('Error checking for existing invite:', inviteError);
    }

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this user.' },
        { status: 409 },
      );
    }

    // 3. Insert invite
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        company_id: companyId,
        role,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (insertError || !invite) {
      return NextResponse.json({ error: 'Failed to create invite.' }, { status: 500 });
    }

    // 4. Send invite email
    if (!resend) {
      return NextResponse.json({ error: 'Email service not available.' }, { status: 500 });
    }
    const inviteLink = `${app.baseUrl}/onboard/invite/${invite.id}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #386B43;">You're invited to join ${companyName} team!</h2>
        <p>Hi ${firstName},</p>
        <p><a href="${inviteLink}" style="background: #386B43; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View invitation</a></p>
        <p style="margin-top: 30px; color: #999; font-size: 14px;">This link will expire in 30 days.</p>
        <p style="margin-top: 30px; color: #999; font-size: 14px;">Best regards,<br>The ${companyName} Team</p>
        <p style="margin-top: 30px; color: #999; font-size: 14px;">If you did not expect this invitation, you can ignore this email.</p>
      </div>
    `;
    const { error: emailError } = await resend.emails.send({
      from: `${app.name} <${app.email}>`,
      to: [email],
      subject: `You're invited to join ${companyName} team!`,
      html: emailHtml,
    });
    if (emailError) {
      return NextResponse.json({ error: 'Failed to send invitation email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, inviteId: invite.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error.' },
      { status: 500 },
    );
  }
}
