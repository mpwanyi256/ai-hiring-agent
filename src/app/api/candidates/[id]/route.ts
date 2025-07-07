import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CandidateStatus } from '@/types/candidates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const profileId = searchParams.get('profileId');
    const { id: candidateId } = await params;

    if (!profileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    if (!candidateId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate ID is required' 
      }, { status: 400 });
    }

    // Fetch candidate with job and evaluation details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        job_id,
        interview_token,
        current_step,
        total_steps,
        is_completed,
        submitted_at,
        created_at,
        status,
        candidate_info_id,
        candidates_info!candidates_candidate_info_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        jobs!inner(
          id,
          title,
          status,
          fields,
          interview_format
        ),
        evaluations(
          id,
          score,
          recommendation,
          summary,
          strengths,
          red_flags,
          skills_assessment,
          traits_assessment,
          feedback,
          created_at,
          updated_at
        )
      `)
      .eq('id', candidateId)
      .eq('jobs.profile_id', profileId)
      .single();

    if (candidateError) {
      if (candidateError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'Candidate not found' 
        }, { status: 404 });
      }
      throw new Error(candidateError.message);
    }

    // Fetch candidate responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        id,
        question,
        answer,
        response_time,
        created_at
      `)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      throw new Error(responsesError.message);
    }

    // Calculate statistics
    const totalQuestions = candidate.total_steps || 0;
    const answeredQuestions = responses?.length || 0;
    const totalInterviewTime = responses?.reduce((sum, r) => sum + (r.response_time || 0), 0) || 0;
    const averageResponseTime = answeredQuestions > 0 ? totalInterviewTime / answeredQuestions : 0;
    const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

    // Format the response data
    const candidateInfo = Array.isArray(candidate.candidates_info) ? candidate.candidates_info[0] : candidate.candidates_info;
    const job = Array.isArray(candidate.jobs) ? candidate.jobs[0] : candidate.jobs;
    const evaluation = candidate.evaluations?.[0];

    const formattedCandidate = {
      id: candidate.id,
      jobId: candidate.job_id,
      interviewToken: candidate.interview_token,
      email: candidateInfo?.email,
      firstName: candidateInfo?.first_name,
      lastName: candidateInfo?.last_name,
      fullName: `${candidateInfo?.first_name || ''} ${candidateInfo?.last_name || ''}`.trim() || 'Anonymous',
      currentStep: candidate.current_step,
      totalSteps: candidate.total_steps,
      isCompleted: candidate.is_completed,
      submittedAt: candidate.submitted_at,
      createdAt: candidate.created_at,
      status: candidate.status || 'under_review',
      job: {
        id: job?.id,
        title: job?.title || 'Unknown Job',
        status: job?.status || 'unknown',
        fields: job?.fields || {},
        interviewFormat: job?.interview_format || 'text',
      },
      responses: responses?.map(response => ({
        id: response.id,
        questionId: response.id,
        question: response.question,
        answer: response.answer,
        responseTime: response.response_time || 0,
        createdAt: response.created_at,
      })) || [],
      evaluation: evaluation ? {
        id: evaluation.id,
        summary: evaluation.summary,
        score: evaluation.score,
        strengths: evaluation.strengths || [],
        redFlags: evaluation.red_flags || [],
        skillsAssessment: evaluation.skills_assessment || {},
        traitsAssessment: evaluation.traits_assessment || {},
        recommendation: evaluation.recommendation,
        feedback: evaluation.feedback,
        createdAt: evaluation.created_at,
        updatedAt: evaluation.updated_at,
      } : null,
      stats: {
        totalQuestions,
        answeredQuestions,
        averageResponseTime,
        totalInterviewTime,
        completionPercentage,
      },
    };

    return NextResponse.json({
      success: true,
      candidate: formattedCandidate,
    });
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch candidate details' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Status is required' 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses: CandidateStatus[] = [
      'under_review',
      'interview_scheduled',
      'shortlisted',
      'reference_check',
      'offer_extended',
      'offer_accepted',
      'hired',
      'rejected',
      'withdrawn'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status value' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Update candidate status
    const { data, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) {
      console.error('Error updating candidate status:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update candidate status' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      candidate: {
        id: data.id,
        status: data.status
      }
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 