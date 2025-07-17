import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CandidateStatus } from '@/types/candidates';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    const { id: jobId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const search = searchParams.get('search') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || null;

    // Get candidate details using the database function (now only returns completed candidates)
    const { data: candidates, error: candidatesError } = await supabase.rpc(
      'get_job_candidate_details',
      {
        p_job_id: jobId,
        p_search: search,
        p_status: status,
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (candidatesError) {
      console.error('Candidates error:', candidatesError);
      throw new Error(candidatesError.message);
    }

    // Get candidate statistics (note: this function still uses profile_id, but we'll pass null)
    const { data: stats, error: statsError } = await supabase.rpc('get_job_candidate_stats', {
      p_job_id: jobId,
      p_profile_id: null,
    });

    if (statsError) {
      console.error('Stats error:', statsError);
      throw new Error(statsError.message);
    }

    const statsData = stats?.[0] || {
      total_candidates: 0,
      completed_candidates: 0,
      in_progress_candidates: 0,
      pending_candidates: 0,
      average_score: 0,
    };

    // Format the response data with resume information
    const formattedCandidates = (candidates || []).map((candidate: Record<string, unknown>) => ({
      id: candidate.id as string,
      jobId: candidate.job_id as string,
      jobTitle: candidate.job_title as string,
      jobStatus: candidate.job_status as string,
      interviewToken: candidate.interview_token as string,
      email: candidate.email as string,
      firstName: candidate.first_name as string,
      lastName: candidate.last_name as string,
      name: candidate.full_name as string,
      currentStep: candidate.current_step as number,
      totalSteps: candidate.total_steps as number,
      isCompleted: candidate.is_completed as boolean,
      progress: Math.round((candidate.progress_percentage as number) || 0),
      responses: (candidate.response_count as number) || 0,
      status: candidate.status as string,
      submittedAt: candidate.submitted_at as string,
      createdAt: candidate.created_at as string,
      updatedAt: candidate.updated_at as string,
      candidateStatus: candidate.candidate_status as CandidateStatus,
      evaluation: candidate.evaluation_id
        ? {
            id: candidate.evaluation_id as string,
            score: (candidate.score as number) || 0,
            recommendation: candidate.recommendation as string,
            summary: candidate.summary as string,
            strengths: (candidate.strengths as string[]) || [],
            redFlags: (candidate.red_flags as string[]) || [],
            skillsAssessment: candidate.skills_assessment as Record<string, any>,
            traitsAssessment: candidate.traits_assessment as Record<string, any>,
            createdAt: candidate.evaluation_created_at as string,
            resumeScore: candidate.resume_score as number,
            resumeSummary: candidate.resume_summary as string,
            evaluationType: candidate.evaluation_type as string,
          }
        : null,
      resume: candidate.resume_id
        ? {
            id: candidate.resume_id as string,
            filename: candidate.resume_filename as string,
            filePath: candidate.resume_file_path as string,
            publicUrl: candidate.resume_public_url as string,
            fileSize: candidate.resume_file_size as number,
            fileType: candidate.resume_file_type as string,
            wordCount: candidate.resume_word_count as number,
            parsingStatus: candidate.resume_parsing_status as string,
            parsingError: candidate.resume_parsing_error as string,
            uploadedAt: candidate.resume_uploaded_at as string,
          }
        : null,
      interviewDetails: candidate.interview_details as Record<string, any> | null,
    }));

    const totalCandidates = parseInt(statsData.total_candidates?.toString() || '0');
    const totalPages = Math.ceil(totalCandidates / limit);

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates,
      stats: {
        total: totalCandidates,
        completed: parseInt(statsData.completed_candidates?.toString() || '0'),
        inProgress: parseInt(statsData.in_progress_candidates?.toString() || '0'),
        pending: parseInt(statsData.pending_candidates?.toString() || '0'),
        averageScore: Math.round(parseFloat(statsData.average_score?.toString() || '0')),
      },
      pagination: {
        page,
        limit,
        total: totalCandidates,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching job candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job candidates',
      },
      { status: 500 },
    );
  }
}
