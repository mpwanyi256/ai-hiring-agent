import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, inviteId } = await request.json();

    if (!email || !password || !firstName || !lastName || !inviteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // First, verify the invite exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });
    }

    // Check if invite is expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', invite.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // Sign up user with invite metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: company.name,
          invite_id: inviteId,
          role: invite.role,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 400 });
    }

    // Return basic user info (user needs to confirm email first)
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName,
        role: invite.role,
        companyId: invite.company_id,
        companyName: company.name,
        companySlug: '',
        subscription: null,
        usageCounts: {
          activeJobs: 0,
          interviewsThisMonth: 0,
        },
        createdAt: data.user.created_at,
      },
      inviteId,
    });
  } catch (error) {
    console.error('Invite signup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
