import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidateId, jobId, resumeContent, resumeFilename, evaluation } = body;

    if (!candidateId || !jobId || !resumeContent || !resumeFilename || !evaluation) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: candidateId, jobId, resumeContent, resumeFilename, evaluation',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check if evaluation already exists
    const { data: existingEvaluation } = await supabase
      .from('evaluations')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .eq('evaluation_type', 'resume')
      .maybeSingle();

    if (existingEvaluation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resume evaluation already exists for this candidate and job',
        },
        { status: 409 },
      );
    }

    // Save the evaluation
    const evaluationData = {
      candidate_id: candidateId,
      job_id: jobId,
      evaluation_type: 'resume',
      summary: evaluation.summary,
      score: 0, // Interview score will be 0 for resume-only evaluations
      resume_score: evaluation.score,
      resume_summary: evaluation.summary,
      resume_filename: resumeFilename,
      strengths: evaluation.matchingSkills || [],
      red_flags: evaluation.missingSkills || [],
      skills_assessment: {},
      traits_assessment: {},
      recommendation: evaluation.recommendation === 'proceed' ? 'yes' : 'no',
      feedback: evaluation.feedback,
    };

    const { data: savedEvaluation, error } = await supabase
      .from('evaluations')
      .insert(evaluationData)
      .select()
      .single();

    if (error) {
      console.error('Database error saving evaluation:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform the response to match expected format
    const transformedEvaluation = {
      id: savedEvaluation.id,
      candidateId: savedEvaluation.candidate_id,
      jobId: savedEvaluation.job_id,
      evaluationType: savedEvaluation.evaluation_type,
      summary: savedEvaluation.summary,
      score: savedEvaluation.score,
      resumeScore: savedEvaluation.resume_score,
      resumeSummary: savedEvaluation.resume_summary,
      resumeFilename: savedEvaluation.resume_filename,
      strengths: savedEvaluation.strengths || [],
      redFlags: savedEvaluation.red_flags || [],
      skillsAssessment: savedEvaluation.skills_assessment || {},
      traitsAssessment: savedEvaluation.traits_assessment || {},
      recommendation: savedEvaluation.recommendation,
      feedback: savedEvaluation.feedback,
      createdAt: savedEvaluation.created_at,
      updatedAt: savedEvaluation.updated_at,
    };

    return NextResponse.json({
      success: true,
      evaluation: transformedEvaluation,
    });
  } catch (error) {
    console.error('Error saving resume evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save resume evaluation',
      },
      { status: 500 },
    );
  }
}
