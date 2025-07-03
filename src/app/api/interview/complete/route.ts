import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { 
      candidateId, 
      jobToken, 
      candidateInfo, 
      resumeEvaluation, 
      resumeContent, 
      totalTimeSpent 
    } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate ID is required' 
      }, { status: 400 });
    }

    const supabase = await createClient();

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
        // This is a simplified scoring - in a real implementation you'd want more sophisticated evaluation
        const interviewScore = Math.min(100, 60 + (responses.length * 5)); // Base 60 + 5 per response, max 100

        // Combine resume and interview scores (70% resume, 30% interview for now)
        const combinedScore = Math.round(
          (resumeEvaluation.score * 0.7) + (interviewScore * 0.3)
        );

        const evaluationData = {
          candidate_id: candidateId,
          job_id: responses[0]?.job_id || null,
          evaluation_type: 'combined',
          summary: `Combined evaluation: Resume score ${resumeEvaluation.score}/100, Interview completion with ${responses.length} responses. Overall assessment: ${combinedScore}/100.`,
          score: interviewScore,
          resume_score: resumeEvaluation.score,
          resume_summary: resumeEvaluation.summary,
          resume_filename: `${candidateInfo?.firstName || 'candidate'}_resume`,
          strengths: resumeEvaluation.matchingSkills || [],
          red_flags: resumeEvaluation.missingSkills || [],
          skills_assessment: {},
          traits_assessment: {},
          recommendation: combinedScore >= 70 ? 'yes' : combinedScore >= 60 ? 'maybe' : 'no',
          feedback: `Interview completed with ${responses.length} questions answered. ${resumeEvaluation.feedback || ''}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

    return NextResponse.json({
      success: true,
      message: 'Interview completed successfully',
      summary: {
        candidateId,
        responsesCount: responses?.length || 0,
        totalTimeSpent,
        completedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to complete interview' 
    }, { status: 500 });
  }
} 