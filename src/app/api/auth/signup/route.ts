import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, companyName } = await request.json();

    if (!email || !password || !firstName || !lastName || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up user with metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      );
    }

    // Return basic user info (user needs to confirm email first)
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName,
        role: 'recruiter',
        companyId: '',
        companyName,
        companySlug: '',
        subscription: null,
        usageCounts: {
          activeJobs: 0,
          interviewsThisMonth: 0,
        },
        createdAt: data.user.created_at,
      },
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 