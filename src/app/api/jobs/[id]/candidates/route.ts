import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type MinimalCandidateRow = {
  id: string;
  job_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  created_at: string;
  progress_percentage: number;
  candidate_status?: string | null;
  job_title: string | null;
  evaluation_score?: number | null;
  score?: number | null;
  resume_score?: number | null;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    const { id: jobId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Optional auth; RLS will gate access
    await supabase.auth.getUser();

    // Query parameters
    const search = searchParams.get('search') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const status = searchParams.get('candidateStatus') || null;

    // Validate job access (RLS will enforce). We still fetch title for response meta
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', jobId)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      }
      if (jobError.code === '42501') {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to access this job' },
          { status: 403 },
        );
      }
      throw jobError;
    }

    // Minimal list using lightweight function
    const { data: minimalRows, error: listError } = await supabase.rpc('get_job_candidate_list', {
      p_job_id: jobId,
      p_search: search,
      p_status: status,
      p_limit: limit,
      p_offset: offset,
    });

    let rows: MinimalCandidateRow[] | null =
      (minimalRows as unknown as MinimalCandidateRow[]) || null;
    if (listError) {
      if (listError.code === 'PGRST202') {
        // Fallback to candidate_details view with minimal column selection
        let q = supabase
          .from('candidate_details')
          .select(
            'id, job_id, email, first_name, last_name, full_name, created_at, progress_percentage, candidate_status:status, job_title, score, resume_score',
          )
          .eq('job_id', jobId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (search) {
          q = q.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
          );
        }
        if (status) {
          q = q.eq('status', status);
        }
        const { data: fallbackRows, error: fallbackError } = await q;
        if (fallbackError) throw fallbackError;
        rows = (fallbackRows as unknown as MinimalCandidateRow[]) || [];
      } else if (listError.code === '42501') {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view candidates for this job' },
          { status: 403 },
        );
      } else {
        throw listError;
      }
    }

    const candidates = (rows || []).map((row: MinimalCandidateRow) => ({
      id: row.id,
      jobId: row.job_id,
      jobTitle: row.job_title,
      jobStatus: '',
      interviewToken: '',
      candidateInfoId: '',
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      name: row.full_name,
      currentStep: 0,
      totalSteps: 0,
      isCompleted: true,
      progress: row.progress_percentage,
      responses: 0,
      status: '',
      submittedAt: '',
      createdAt: row.created_at,
      updatedAt: row.created_at,
      candidateStatus: row.candidate_status,
      evaluation:
        (row.evaluation_score ?? row.score) != null
          ? {
              id: '',
              score: (row.evaluation_score ?? row.score) || 0,
              recommendation: '',
              summary: '',
              strengths: [],
              redFlags: [],
              skillsAssessment: {},
              traitsAssessment: {
                skills: 0,
                culture: 0,
                team_work: 0,
                communication: 0,
                growth_mindset: 0,
              },
              createdAt: row.created_at,
              resumeScore: (row.resume_score ?? 0) || 0,
              resumeSummary: '',
              evaluationType: 'manual',
            }
          : null,
      resume: null,
    }));

    // Stats using existing function (RLS-protected)
    const { data: stats } = await supabase.rpc('get_job_candidate_stats', {
      p_job_id: jobId,
      p_profile_id: null,
    });

    const statsData = stats?.[0] || {
      total_candidates: candidates.length,
      completed_candidates: 0,
      in_progress_candidates: 0,
      pending_candidates: 0,
      average_score: 0,
    };

    const totalPages = Math.ceil((statsData.total_candidates || candidates.length) / limit);

    return NextResponse.json({
      success: true,
      candidates,
      job: { id: job.id, title: job.title },
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
        total: statsData.total_candidates ?? candidates.length,
        totalPages,
        hasMore: candidates.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch candidates', candidates: [] },
      { status: 500 },
    );
  }
}
