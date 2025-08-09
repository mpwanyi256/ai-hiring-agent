import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!candidateId || !jobId) {
      return NextResponse.json({ error: 'Candidate ID and Job ID are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user has access to this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, profile_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.profile_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Call the analytics function
    const { data: analyticsResult, error: analyticsError } = await supabase.rpc(
      'get_candidate_analytics',
      {
        candidate_uuid: candidateId,
        job_uuid: jobId,
      },
    );

    if (analyticsError) {
      console.error('Analytics function error:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const result = analyticsResult?.[0] || ({} as any);

    // Fetch team response summary
    const { data: teamSummary, error: teamSummaryError } = await supabase.rpc(
      'get_team_response_summary',
      { p_candidate_id: candidateId, p_job_id: jobId },
    );

    if (teamSummaryError) {
      console.warn('Team summary fetch error:', teamSummaryError);
    }

    // Ensure the response structure is correct
    const response = {
      analytics: result.analytics || {
        id: null,
        candidate_id: candidateId,
        job_id: jobId,
        total_responses: 0,
        average_response_time_seconds: 0,
        completion_percentage: 0,
        questions_answered: 0,
        total_questions: 0,
        overall_score: 0,
        resume_score: 0,
        interview_score: 0,
        ai_score: null,
        response_quality_score: 0,
        communication_score: null,
        technical_score: null,
        problem_solving_score: null,
        time_spent_minutes: 0,
        last_activity_at: null,
        engagement_level: 'low',
        percentile_rank: 0,
        rank_in_job: 0,
        total_candidates_in_job: 0,
        ai_recommendation: null,
        confidence_score: null,
        strengths_summary: null,
        areas_for_improvement: null,
        red_flags: null,
        created_at: null,
        updated_at: null,
      },
      response_analytics: result.response_analytics || [],
      comparative_data: result.comparative_data || {
        total_candidates: 0,
        average_score: 0,
        top_percentile: 0,
        median_score: 0,
        completion_rate: 0,
        average_time_spent: 0,
      },
      ai_assessment: result.ai_assessment || null,
      team_summary:
        Array.isArray(teamSummary) && teamSummary.length > 0
          ? teamSummary[0]
          : {
              total_responses: 0,
              positive_votes: 0,
              negative_votes: 0,
              neutral_votes: 0,
              avg_confidence: null,
              avg_technical_skills: null,
              avg_communication_skills: null,
              avg_cultural_fit: null,
            },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching candidate analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
