import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const candidateId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    // Get candidate details with job and evaluation information
    const { data: candidate, error: candidateError } = await supabase
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
          status,
          fields,
          interview_format
        ),
        evaluations(
          id,
          summary,
          score,
          strengths,
          red_flags,
          skills_assessment,
          traits_assessment,
          recommendation,
          feedback,
          created_at,
          updated_at
        )
      `)
      .eq('id', candidateId)
      .eq('jobs.profile_id', profileId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate not found' 
      }, { status: 404 });
    }

    // Get candidate responses with question details
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        id,
        question_id,
        question,
        answer,
        response_time,
        created_at
      `)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    // Handle the jobs relation
    const job = Array.isArray(candidate.jobs) ? candidate.jobs[0] : candidate.jobs;

    // Format the candidate data
    const formattedCandidate = {
      id: candidate.id,
      jobId: candidate.job_id,
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
      submittedAt: candidate.submitted_at,
      createdAt: candidate.created_at,
      
      // Job information
      job: {
        id: job?.id,
        title: job?.title || 'Unknown Job',
        status: job?.status || 'unknown',
        fields: job?.fields || {},
        interviewFormat: job?.interview_format || 'text',
      },

      // Interview responses
      responses: responses?.map(response => ({
        id: response.id,
        questionId: response.question_id,
        question: response.question,
        answer: response.answer,
        responseTime: response.response_time,
        createdAt: response.created_at,
      })) || [],

      // AI evaluation
      evaluation: candidate.evaluations?.[0] ? {
        id: candidate.evaluations[0].id,
        summary: candidate.evaluations[0].summary,
        score: candidate.evaluations[0].score,
        strengths: candidate.evaluations[0].strengths || [],
        redFlags: candidate.evaluations[0].red_flags || [],
        skillsAssessment: candidate.evaluations[0].skills_assessment || {},
        traitsAssessment: candidate.evaluations[0].traits_assessment || {},
        recommendation: candidate.evaluations[0].recommendation,
        feedback: candidate.evaluations[0].feedback,
        createdAt: candidate.evaluations[0].created_at,
        updatedAt: candidate.evaluations[0].updated_at,
      } : null,

      // Interview statistics
      stats: {
        totalQuestions: candidate.total_steps,
        answeredQuestions: responses?.length || 0,
        averageResponseTime: responses && responses.length > 0 
          ? Math.round(responses.reduce((sum, r) => sum + r.response_time, 0) / responses.length)
          : 0,
        totalInterviewTime: responses?.reduce((sum, r) => sum + r.response_time, 0) || 0,
        completionPercentage: candidate.total_steps > 0 
          ? Math.round(((responses?.length || 0) / candidate.total_steps) * 100) 
          : 0,
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