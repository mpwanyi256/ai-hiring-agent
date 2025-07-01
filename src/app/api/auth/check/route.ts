import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ user: null, isAuthenticated: false });
    }

    // Fetch user data from the comprehensive user_details view
    const { data: userDetails, error: userError } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user details:', userError);
      return NextResponse.json({ user: null, isAuthenticated: false });
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
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Check auth API error:', error);
    return NextResponse.json({ user: null, isAuthenticated: false });
  }
} 