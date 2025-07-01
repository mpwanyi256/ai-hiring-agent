import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, token, type = 'email' } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) {
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'expired', message: 'Verification code has expired' },
          { status: 400 }
        );
      } else if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'invalid', message: 'Invalid verification code' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'verification_failed', message: error.message },
          { status: 400 }
        );
      }
    }

    if (data.user) {
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
        success: true,
      });
    }

    return NextResponse.json(
      { error: 'verification_failed', message: 'Verification failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 