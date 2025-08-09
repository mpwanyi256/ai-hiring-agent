import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkJobPermission } from '@/lib/utils/jobPermissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    const { id: jobId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Get current user and check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view this job's candidates
    const hasPermission = await checkJobPermission(supabase, user.id, jobId);

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to access candidates for this job',
        },
        { status: 403 },
      );
    }

    // Get query parameters
    const search = searchParams.get('search') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : null;
    const maxScore = searchParams.get('maxScore') ? parseInt(searchParams.get('maxScore')!) : null;
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;
    const statusFilter = searchParams.get('candidateStatus');
    const candidateStatus = ['all'].includes(statusFilter || '') ? null : statusFilter;

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get candidate details using the database function (now only returns completed candidates)
    const { data: rawCandidates, error: candidatesError } = await supabase.rpc(
      'get_job_candidate_details',
      {
        p_job_id: jobId,
        p_search: search,
        p_status: candidateStatus,
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (candidatesError) {
      console.error('Candidates error:', candidatesError);
      throw new Error(candidatesError.message);
    }

    // Transform flattened data into nested structure
    const candidates = (rawCandidates || []).map((candidate: any) => ({
      id: candidate.id,
      jobId: candidate.job_id,
      jobTitle: candidate.job_title,
      jobStatus: candidate.job_status,
      interviewToken: candidate.interview_token,
      candidateInfoId: candidate.candidate_info_id,
      email: candidate.email,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      name: candidate.full_name || `${candidate.first_name} ${candidate.last_name}`.trim(),
      currentStep: candidate.current_step,
      totalSteps: candidate.total_steps,
      isCompleted: candidate.is_completed,
      progress: candidate.progress_percentage,
      responses: candidate.response_count || 0,
      status: candidate.status,
      submittedAt: candidate.submitted_at,
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
      candidateStatus: candidate.candidate_status,
      evaluation: candidate.evaluation_id
        ? {
            id: candidate.evaluation_id,
            score: candidate.score || 0,
            recommendation: candidate.recommendation || '',
            summary: candidate.summary || '',
            strengths: candidate.strengths || [],
            redFlags: candidate.red_flags || [],
            skillsAssessment: candidate.skills_assessment || {},
            traitsAssessment: candidate.traits_assessment || {
              skills: 0,
              culture: 0,
              team_work: 0,
              communication: 0,
              growth_mindset: 0,
            },
            createdAt: candidate.evaluation_created_at,
            resumeScore: candidate.resume_score || 0,
            resumeSummary: candidate.resume_summary || '',
            evaluationType: candidate.evaluation_type || 'manual',
          }
        : null,
      resume: candidate.resume_id
        ? {
            id: candidate.resume_id,
            filename: candidate.resume_filename,
            filePath: candidate.resume_file_path,
            publicUrl: candidate.resume_public_url,
            fileSize: candidate.resume_file_size || 0,
            fileType: candidate.resume_file_type,
            wordCount: candidate.resume_word_count || 0,
            parsingStatus: candidate.resume_parsing_status || 'pending',
            parsingError: candidate.resume_parsing_error,
            uploadedAt: candidate.resume_uploaded_at,
          }
        : null,
    }));

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

    const totalPages = Math.ceil(statsData.total_candidates / limit);

    // Return response in CandidateListResponse format
    return NextResponse.json({
      success: true,
      candidates,
      job: {
        id: job.id,
        title: job.title,
      },
      stats: {
        total: statsData.total_candidates,
        completed: statsData.completed_candidates,
        inProgress: statsData.in_progress_candidates,
        pending: statsData.pending_candidates,
        averageScore: statsData.average_score,
      },
      pagination: {
        page,
        limit,
        total: statsData.total_candidates,
        totalPages,
        hasMore: (candidates || []).length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candidates',
        candidates: [],
        job: { id: '', title: '' },
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          averageScore: 0,
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      },
      { status: 500 },
    );
  }
}
