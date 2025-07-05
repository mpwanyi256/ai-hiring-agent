import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');

    if (!candidateId || !jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'candidateId and jobId are required' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Check for existing resume evaluation
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .eq('evaluation_type', 'resume')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No evaluation found
        return NextResponse.json({ 
          success: true, 
          evaluation: null 
        });
      }
      throw error;
    }

    // Transform the data to match the expected format
    const transformedEvaluation = {
      id: evaluation.id,
      candidateId: evaluation.candidate_id,
      jobId: evaluation.job_id,
      evaluationType: evaluation.evaluation_type,
      summary: evaluation.summary,
      score: evaluation.score,
      resumeScore: evaluation.resume_score,
      resumeSummary: evaluation.resume_summary,
      resumeFilename: evaluation.resume_filename,
      strengths: evaluation.strengths || [],
      redFlags: evaluation.red_flags || [],
      skillsAssessment: evaluation.skills_assessment || {},
      traitsAssessment: evaluation.traits_assessment || {},
      recommendation: evaluation.recommendation,
      feedback: evaluation.feedback,
      createdAt: evaluation.created_at,
      updatedAt: evaluation.updated_at
    };

    return NextResponse.json({
      success: true,
      evaluation: transformedEvaluation
    });

  } catch (error) {
    console.error('Error fetching resume evaluation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch resume evaluation' 
    }, { status: 500 });
  }
} 