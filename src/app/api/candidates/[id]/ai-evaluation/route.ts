import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Await params before accessing properties (Next.js 15 requirement)
    const resolvedParams = await params;
    const candidateId = resolvedParams.id;
    
    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    const profileId = profile.id;

    // Verify user has access to this candidate through job ownership
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        job_id,
        jobs!inner(
          id,
          title,
          profile_id
        )
      `)
      .eq('id', candidateId)
      .eq('jobs.profile_id', profileId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate not found or access denied' 
      }, { status: 404 });
    }

    // Get AI evaluation
    const { data: aiEvaluation, error: aiEvaluationError } = await supabase
      .from('ai_evaluations')
      .select('*')
      .eq('candidate_id', candidateId)
      .single();

    if (aiEvaluationError && aiEvaluationError.code !== 'PGRST116') {
      console.error('AI evaluation error:', aiEvaluationError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch AI evaluation' 
      }, { status: 500 });
    }

    // Get team assessments
    const { data: teamAssessments, error: teamAssessmentsError } = await supabase
      .from('team_assessments')
      .select(`
        *,
        profiles!assessor_profile_id(
          first_name,
          last_name
        )
      `)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (teamAssessmentsError) {
      console.error('Team assessments error:', teamAssessmentsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch team assessments' 
      }, { status: 500 });
    }

    // Format the response data
    const formattedAIEvaluation = aiEvaluation ? {
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
      updatedAt: aiEvaluation.updated_at
    } : null;

    const formattedTeamAssessments = (teamAssessments || []).map((assessment: {
      id: string;
      candidate_id: string;
      job_id: string;
      ai_evaluation_id: string | null;
      assessor_profile_id: string;
      assessor_name: string;
      assessor_role: string;
      overall_rating: number;
      overall_rating_status: string;
      category_ratings: Record<string, unknown>;
      assessment_comments: string | null;
      private_notes: string | null;
      assessment_type: string;
      interview_duration_minutes: number | null;
      created_at: string;
      updated_at: string;
      profiles: { first_name: string; last_name: string } | null;
    }) => ({
      id: assessment.id,
      candidateId: assessment.candidate_id,
      jobId: assessment.job_id,
      aiEvaluationId: assessment.ai_evaluation_id,
      assessorProfileId: assessment.assessor_profile_id,
      assessorName: assessment.assessor_name,
      assessorRole: assessment.assessor_role,
      overallRating: assessment.overall_rating,
      overallRatingStatus: assessment.overall_rating_status,
      categoryRatings: assessment.category_ratings,
      assessmentComments: assessment.assessment_comments,
      privateNotes: assessment.private_notes,
      assessmentType: assessment.assessment_type,
      interviewDurationMinutes: assessment.interview_duration_minutes,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at,
      assessorProfile: assessment.profiles ? {
        firstName: assessment.profiles.first_name,
        lastName: assessment.profiles.last_name
      } : null
    }));

    // Calculate computed values if AI evaluation exists
    const computedValues = formattedAIEvaluation ? {
      averageTeamRating: formattedTeamAssessments.length > 0
        ? formattedTeamAssessments.reduce((sum, assessment) => sum + assessment.overallRating, 0) / formattedTeamAssessments.length
        : 0,
      totalAssessors: formattedTeamAssessments.length,
      consensusLevel: 'medium' as 'high' | 'medium' | 'low', // TODO: Calculate based on AI vs team scores
      finalRecommendation: formattedAIEvaluation.recommendation // TODO: Calculate weighted recommendation
    } : null;

    // Get job title from the nested jobs relationship
    const jobData = candidate.jobs as unknown;
    let jobTitle = 'Unknown Position';
    
    if (Array.isArray(jobData) && jobData.length > 0) {
      jobTitle = (jobData[0] as { title: string }).title;
    } else if (jobData && typeof jobData === 'object' && 'title' in jobData) {
      jobTitle = (jobData as { title: string }).title;
    }

    return NextResponse.json({
      success: true,
      aiEvaluation: formattedAIEvaluation,
      teamAssessments: formattedTeamAssessments,
      computedValues,
      candidateInfo: {
        id: candidate.id,
        jobId: candidate.job_id,
        jobTitle: jobTitle
      }
    });

  } catch (error) {
    console.error('Error fetching AI evaluation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch AI evaluation'
    }, { status: 500 });
  }
} 