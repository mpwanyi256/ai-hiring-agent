import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InterviewCompletePayload } from '@/types/interview';
import { edgeFunctionsService } from '@/lib/services/edgeFunctionsService';

export async function POST(request: Request) {
  try {
    const { candidateId, candidateInfo, resumeEvaluation, totalTimeSpent } =
      (await request.json()) as InterviewCompletePayload;

    if (!candidateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Candidate ID is required',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Update candidate record to mark as completed
    try {
      const { error: candidateError } = await supabase
        .from('candidates')
        .update({
          is_completed: true,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateId);

      if (candidateError) {
        console.warn('Failed to update candidate completion status:', candidateError);
      }
    } catch (updateError) {
      console.warn('Error updating candidate:', updateError);
    }

    // Get all responses for this candidate
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
    }

    // Create a combined evaluation if we have both resume and interview data
    if (resumeEvaluation && responses && responses.length > 0) {
      try {
        // Calculate interview score based on responses
        const interviewScore = Math.min(100, 60 + responses.length * 5);
        // Combine resume and interview scores (70% resume, 30% interview for now)
        const combinedScore = Math.round(resumeEvaluation.score * 0.7 + interviewScore * 0.3);
        const evaluationData = {
          candidate_id: candidateId,
          job_id: responses[0]?.job_id || null,
          evaluation_type: 'combined',
          summary: `Interview completed successfully with ${responses.length} responses. Resume evaluation score: ${resumeEvaluation.score}%. Combined assessment score: ${combinedScore}%.`,
          score: combinedScore,
          resume_score: resumeEvaluation.score,
          resume_summary: resumeEvaluation.summary,
          resume_filename: `${candidateInfo?.firstName || 'candidate'}_resume`,
          strengths: resumeEvaluation.matchingSkills || [],
          red_flags: resumeEvaluation.missingSkills || [],
          skills_assessment: {},
          traits_assessment: {},
          recommendation: combinedScore >= 70 ? 'yes' : combinedScore >= 60 ? 'maybe' : 'no',
          feedback: `Interview completed with ${responses.length} questions answered in approximately ${Math.round(totalTimeSpent / 60)} minutes. ${resumeEvaluation.feedback || ''}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data: evaluation, error: evalError } = await supabase
          .from('evaluations')
          .insert(evaluationData)
          .select()
          .single();
        if (evalError) {
          console.warn('Failed to save evaluation:', evalError);
        } else {
          console.log('Interview evaluation saved:', evaluation.id);
        }
      } catch (evalError) {
        console.error('Error creating evaluation:', evalError);
      }
    }

    // Trigger the ai-candidate-evaluation background function
    const response = await edgeFunctionsService.triggerAiCandidateEvaluation({
      candidateId: candidateInfo.id,
      jobId: candidateInfo.jobId,
    });

    console.log('AI evaluation triggered:', response);

    return NextResponse.json({
      success: true,
      message: 'Interview completed successfully',
      summary: {
        candidateId,
        responsesCount: responses?.length || 0,
        totalTimeSpent,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete interview',
      },
      { status: 500 },
    );
  }
}
