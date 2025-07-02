import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const profileId = searchParams.get('profileId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status'); // 'completed', 'in_progress', 'all'
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!profileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    // Build the query
    let query = supabase
      .from('candidates')
      .select(`
        id,
        job_id,
        interview_token,
        email,
        first_name,
        last_name,
        current_step,
        total_steps,
        is_completed,
        submitted_at,
        created_at,
        jobs!inner(
          id,
          title,
          profile_id,
          status
        ),
        evaluations(
          id,
          score,
          recommendation,
          summary,
          strengths,
          red_flags,
          created_at
        )
      `)
      .eq('jobs.profile_id', profileId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (status === 'completed') {
      query = query.eq('is_completed', true);
    } else if (status === 'in_progress') {
      query = query.eq('is_completed', false);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('candidates')
      .select('*, jobs!inner(profile_id)', { count: 'exact', head: true })
      .eq('jobs.profile_id', profileId);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: candidates, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Get candidate response counts
    const candidateIds = candidates?.map(c => c.id) || [];
    let responseCounts: Record<string, number> = {};

    if (candidateIds.length > 0) {
      const { data: responses } = await supabase
        .from('responses')
        .select('candidate_id')
        .in('candidate_id', candidateIds);

      if (responses) {
        responseCounts = responses.reduce((acc, r) => {
          acc[r.candidate_id] = (acc[r.candidate_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Format the response data
    const formattedCandidates = candidates?.map(candidate => {
      // Handle the jobs relation - it's returned as an array but we know there's only one
      const job = Array.isArray(candidate.jobs) ? candidate.jobs[0] : candidate.jobs;
      
      return {
        id: candidate.id,
        jobId: candidate.job_id,
        jobTitle: job?.title || 'Unknown Job',
        jobStatus: job?.status || 'unknown',
        interviewToken: candidate.interview_token,
        email: candidate.email,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        fullName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Anonymous',
        currentStep: candidate.current_step,
        totalSteps: candidate.total_steps,
        isCompleted: candidate.is_completed,
        completionPercentage: candidate.total_steps > 0 
          ? Math.round((candidate.current_step / candidate.total_steps) * 100) 
          : 0,
        responseCount: responseCounts[candidate.id] || 0,
        submittedAt: candidate.submitted_at,
        createdAt: candidate.created_at,
        evaluation: candidate.evaluations?.[0] ? {
          id: candidate.evaluations[0].id,
          score: candidate.evaluations[0].score,
          recommendation: candidate.evaluations[0].recommendation,
          summary: candidate.evaluations[0].summary,
          strengths: candidate.evaluations[0].strengths,
          redFlags: candidate.evaluations[0].red_flags,
          createdAt: candidate.evaluations[0].created_at,
        } : null,
      };
    }) || [];

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
      stats: {
        total: count || 0,
        completed: formattedCandidates.filter(c => c.isCompleted).length,
        inProgress: formattedCandidates.filter(c => !c.isCompleted).length,
        averageScore: formattedCandidates
          .filter(c => c.evaluation?.score)
          .reduce((sum, c, _, arr) => sum + (c.evaluation?.score || 0) / arr.length, 0) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch candidates' 
    }, { status: 500 });
  }
} 