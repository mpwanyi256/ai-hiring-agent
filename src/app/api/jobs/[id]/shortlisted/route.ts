import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';

export async function GET(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const supabase = await createClient();
    const { id: jobId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status')?.split(',') || [
      'interview_scheduled',
      'shortlisted',
      'reference_check',
      'offer_extended',
      'offer_accepted',
      'hired',
      'withdrawn',
    ];
    const offset = (page - 1) * limit;

    // Advanced filters
    // const startDate = searchParams.get('startDate');
    // const endDate = searchParams.get('endDate');
    // const minScore = searchParams.get('minScore');
    // const maxScore = searchParams.get('maxScore');
    // const recommendation = searchParams.get('recommendation');
    // const candidateStatus = searchParams.get('candidateStatus'); // New filter for candidate_status
    // const sortBy = searchParams.get('sortBy') || 'created_at';
    // const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build the query using candidate_details view
    let query = supabase
      .from('candidate_details')
      .select('*')
      .in('candidate_status', status)
      .eq('job_id', jobId)
      .eq('is_completed', true);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('candidate_details')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .in('candidate_status', status);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: candidates, error } = await query.order('score', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Format the response data to match the expected interface
    const formattedCandidates =
      candidates?.map((candidate) => ({
        id: candidate.id,
        jobId: candidate.job_id,
        jobTitle: candidate.job_title || 'Unknown Job',
        jobStatus: candidate.job_status || 'unknown',
        interviewToken: candidate.interview_token,
        email: candidate.email,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        fullName: candidate.full_name,
        currentStep: candidate.current_step,
        totalSteps: candidate.total_steps,
        isCompleted: candidate.is_completed,
        completionPercentage: candidate.progress_percentage || 0,
        responseCount: candidate.response_count || 0,
        submittedAt: candidate.submitted_at,
        createdAt: candidate.created_at,
        status: candidate.candidate_status,
        interviewDetails: candidate.interview_details,
        evaluation: candidate.evaluation_id
          ? {
              id: candidate.evaluation_id,
              score: candidate.score,
              recommendation: candidate.recommendation,
              summary: candidate.summary,
              strengths: candidate.strengths || [],
              redFlags: candidate.red_flags || [],
              createdAt: candidate.evaluation_created_at,
            }
          : null,
      })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch candidates',
      },
      { status: 500 },
    );
  }
}
