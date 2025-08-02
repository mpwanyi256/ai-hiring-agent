import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
  }

  try {
    // Get candidates count metrics
    const candidatesMetrics = await getCandidatesMetrics(supabase, companyId);

    // Get average response time metrics
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
  // Get total candidates count
  const { data: totalCandidates, error: totalError } = await supabase
    .from('candidate_details')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if (totalError) {
    console.error('Error fetching total candidates:', totalError);
    throw totalError;
  }

  // Get candidates count for this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: weekCandidates, error: weekError } = await supabase
    .from('candidate_details')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', oneWeekAgo.toISOString());

  if (weekError) {
    console.error('Error fetching week candidates:', weekError);
    throw weekError;
  }

  return {
    total: totalCandidates || 0,
    thisWeek: weekCandidates || 0,
    trend: {
      value: weekCandidates || 0,
      isPositive: (weekCandidates || 0) > 0,
      label: 'this week',
    },
  };
}

async function getResponseTimeMetrics(supabase: any, companyId: string) {
  // Get completed interviews with their response times
  const { data: interviews, error: interviewsError } = await supabase
    .from('interviews')
    .select(
      `
      id,
      created_at,
      date,
      time,
      status,
      candidate_details!inner(company_id)
    `,
    )
    .eq('candidate_details.company_id', companyId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(100); // Get last 100 completed interviews for calculation

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
    const interviewDateTime = new Date(`${interview.date}T${interview.time}`);

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
