import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 },
      );
    }

    const companyId = profile.company_id;

    // Get candidates count metrics (company-wide)
    const candidatesMetrics = await getCandidatesMetrics(supabase, companyId);

    // Get average response time metrics (company-wide)
    const responseTimeMetrics = await getResponseTimeMetrics(supabase, companyId);

    return NextResponse.json({
      success: true,
      metrics: {
        candidates: candidatesMetrics,
        responseTime: responseTimeMetrics,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function getCandidatesMetrics(supabase: any, companyId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase.rpc('get_company_candidate_counts', {
    p_company_id: companyId,
    p_since: oneWeekAgo.toISOString(),
  });

  if (error) {
    console.error('Error fetching company candidate counts:', error);
    throw error;
  }

  const total = Array.isArray(data) && data[0]?.total ? Number(data[0].total) : 0;
  const since = Array.isArray(data) && data[0]?.since_count ? Number(data[0].since_count) : 0;

  return {
    total,
    thisWeek: since,
    trend: {
      value: since,
      isPositive: since > 0,
      label: 'this week',
    },
  };
}

async function getResponseTimeMetrics(supabase: any, companyId: string) {
  const { data: interviews, error: interviewsError } = await supabase.rpc(
    'get_company_completed_interviews',
    { p_company_id: companyId, p_limit: 100 },
  );

  if (interviewsError) {
    console.error('Error fetching interviews for response time:', interviewsError);
    throw interviewsError;
  }

  if (!interviews || interviews.length === 0) {
    return {
      averageHours: 0,
      formattedTime: '0h',
      trend: {
        value: 0,
        isPositive: true,
        label: 'no data',
      },
    };
  }

  // Calculate average response time (time from application to interview completion)
  const responseTimes: number[] = [];

  for (const interview of interviews) {
    const createdAt = new Date(interview.created_at);
    const interviewDateTime = new Date(`${interview.interview_date}T${interview.interview_time}`);

    // Calculate hours between creation and interview
    const diffMs = interviewDateTime.getTime() - createdAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 0) {
      responseTimes.push(diffHours);
    }
  }

  if (responseTimes.length === 0) {
    return {
      averageHours: 0,
      formattedTime: '0h',
      trend: {
        value: 0,
        isPositive: true,
        label: 'no data',
      },
    };
  }

  const averageHours = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

  // Format the time nicely
  const formattedTime = formatResponseTime(averageHours);

  // Calculate trend (compare with previous period)
  const halfLength = Math.floor(responseTimes.length / 2);
  const recentAvg =
    responseTimes.slice(0, halfLength).reduce((sum, time) => sum + time, 0) / halfLength;
  const olderAvg =
    responseTimes.slice(halfLength).reduce((sum, time) => sum + time, 0) /
    (responseTimes.length - halfLength);

  const trendValue = Math.abs(recentAvg - olderAvg);
  const isImproving = recentAvg < olderAvg; // Lower response time is better

  return {
    averageHours,
    formattedTime,
    trend: {
      value: Math.round(trendValue * 10) / 10, // Round to 1 decimal
      isPositive: isImproving,
      label: isImproving ? 'faster' : 'slower',
    },
  };
}

function formatResponseTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  } else if (hours < 24) {
    const roundedHours = Math.round(hours * 10) / 10;
    return `${roundedHours}h`;
  } else {
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days}d`;
  }
}
