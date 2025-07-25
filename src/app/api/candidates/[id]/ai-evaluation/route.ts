import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TeamResponseWithProfile {
  id: string;
  candidate_id: string;
  job_id: string;
  user_id: string;
  vote: string;
  comment: string | null;
  confidence_level: number;
  technical_skills: number | null;
  communication_skills: number | null;
  cultural_fit: number | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id: candidateId } = await params;

    // Fetch the candidate (do not require candidates_info join for existence)
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(
        `
        id, 
        job_id,
        current_step,
        total_steps,
        is_completed,
        candidate_info_id
      `,
      )
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Candidate not found',
        },
        { status: 404 },
      );
    }

    // Fetch candidate info (optional)
    let candidateInfo = null;
    if (candidate.candidate_info_id) {
      const { data: info, error: infoError } = await supabase
        .from('candidates_info')
        .select('id, first_name, last_name, email')
        .eq('id', candidate.candidate_info_id)
        .single();
      if (!infoError && info) {
        candidateInfo = info;
      }
    }

    // Fetch the job and check ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, profile_id')
      .eq('id', candidate.job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 },
      );
    }

    // Get AI evaluation (return null if not found)
    const { data: aiEvaluation, error: aiEvaluationError } = await supabase
      .from('ai_evaluations')
      .select('*')
      .eq('candidate_id', candidateId)
      .single();

    if (
      aiEvaluationError &&
      aiEvaluationError.code !== 'PGRST116' &&
      aiEvaluationError.code !== '406'
    ) {
      // 406 is "No rows found" for some Supabase versions
      console.error('AI evaluation error:', aiEvaluationError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch AI evaluation',
        },
        { status: 500 },
      );
    }

    // Get team responses (replacing team_assessments)
    const { data: teamResponses, error: teamResponsesError } = await supabase
      .from('team_responses')
      .select(
        `
        *,
        profiles!user_id(
          first_name,
          last_name,
          role
        )
      `,
      )
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (teamResponsesError) {
      console.error('Team responses error:', teamResponsesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch team responses',
        },
        { status: 500 },
      );
    }

    // Format the response data
    const formattedAIEvaluation = aiEvaluation
      ? {
          id: aiEvaluation.id,
          candidateId: aiEvaluation.candidate_id,
          jobId: aiEvaluation.job_id,
          profileId: aiEvaluation.profile_id,
          overallScore: aiEvaluation.overall_score,
          overallStatus: aiEvaluation.overall_status,
          recommendation: aiEvaluation.recommendation,
          evaluationSummary: aiEvaluation.evaluation_summary,
          evaluationExplanation: aiEvaluation.evaluation_explanation,
          radarMetrics: aiEvaluation.radar_metrics,
          categoryScores: aiEvaluation.category_scores,
          keyStrengths: aiEvaluation.key_strengths,
          areasForImprovement: aiEvaluation.areas_for_improvement,
          redFlags: aiEvaluation.red_flags,
          evaluationSources: aiEvaluation.evaluation_sources,
          processingDurationMs: aiEvaluation.processing_duration_ms,
          aiModelVersion: aiEvaluation.ai_model_version,
          evaluationVersion: aiEvaluation.evaluation_version,
          createdAt: aiEvaluation.created_at,
          updatedAt: aiEvaluation.updated_at,
        }
      : null;

    // Format team responses to match the expected structure
    const formattedTeamAssessments = (teamResponses || []).map(
      (response: TeamResponseWithProfile) => {
        const profile = Array.isArray(response.profiles) ? response.profiles[0] : response.profiles;

        // Convert team response to assessment-like structure
        const overallRating = response.confidence_level / 2; // Convert 1-10 scale to 1-5 scale

        return {
          id: response.id,
          candidateId: response.candidate_id,
          jobId: response.job_id,
          assessorProfileId: response.user_id,
          assessorName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          assessorRole: profile?.role || 'viewer',
          overallRating: overallRating,
          overallRatingStatus: response.vote as 'positive' | 'negative' | 'neutral',
          categoryRatings: {
            technical_skills: response.technical_skills || 0,
            communication_skills: response.communication_skills || 0,
            cultural_fit: response.cultural_fit || 0,
          },
          assessmentComments: response.comment || '',
          privateNotes: '',
          assessmentType: 'team_response' as const,
          interviewDurationMinutes: null,
          createdAt: response.created_at,
          updatedAt: response.updated_at,
          assessorProfile: profile
            ? {
                firstName: profile.first_name,
                lastName: profile.last_name,
              }
            : null,
        };
      },
    );

    // Calculate computed values if AI evaluation exists
    const computedValues = formattedAIEvaluation
      ? {
          averageTeamRating:
            formattedTeamAssessments.length > 0
              ? formattedTeamAssessments.reduce(
                  (sum, assessment) => sum + assessment.overallRating,
                  0,
                ) / formattedTeamAssessments.length
              : 0,
          totalAssessors: formattedTeamAssessments.length,
          consensusLevel: 'medium' as 'high' | 'medium' | 'low', // TODO: Calculate based on AI vs team scores
          finalRecommendation: formattedAIEvaluation.recommendation, // TODO: Calculate weighted recommendation
        }
      : null;

    const response = {
      success: true,
      aiEvaluation: formattedAIEvaluation, // can be null
      teamAssessments: formattedTeamAssessments,
      computedValues,
      candidateInfo: {
        id: candidate.id,
        jobId: candidate.job_id,
        jobTitle: job.title,
        firstName: candidateInfo?.first_name,
        lastName: candidateInfo?.last_name,
        email: candidateInfo?.email,
        currentStep: candidate.current_step,
        totalSteps: candidate.total_steps,
        isCompleted: candidate.is_completed,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching AI evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch AI evaluation',
      },
      { status: 500 },
    );
  }
}
