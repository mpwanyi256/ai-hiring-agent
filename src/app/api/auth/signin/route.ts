import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if it's an email not confirmed error
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { 
            error: 'EMAIL_NOT_CONFIRMED',
            email,
            message: 'Email not confirmed' 
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if user's email is confirmed
    if (data.user && !data.user.email_confirmed_at) {
      return NextResponse.json(
        { 
          error: 'EMAIL_NOT_CONFIRMED',
          email,
          message: 'Email not confirmed' 
        },
        { status: 400 }
      );
    }

    // Fetch user data from the comprehensive user_details view
    const { data: userDetails, error: userError } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: userDetails.id,
        email: userDetails.email,
        firstName: userDetails.first_name,
        lastName: userDetails.last_name,
        role: userDetails.role,
        companyId: userDetails.company_id || '',
        companyName: userDetails.company_name || '',
        companySlug: userDetails.company_slug || '',
        subscription: userDetails.subscription_id ? {
          id: userDetails.subscription_id,
          name: userDetails.subscription_name,
          maxJobs: userDetails.max_jobs,
          maxInterviewsPerMonth: userDetails.max_interviews_per_month,
          status: userDetails.subscription_status,
        } : null,
        usageCounts: {
          activeJobs: userDetails.active_jobs_count || 0,
          interviewsThisMonth: userDetails.interviews_this_month || 0,
        },
        createdAt: userDetails.user_created_at,
      },
    });
  } catch (error) {
    console.error('Signin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 