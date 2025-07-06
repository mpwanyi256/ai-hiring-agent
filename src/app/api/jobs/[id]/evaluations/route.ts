import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch evaluations for the job with candidate information
    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select(`
        id,
        candidate_id,
        evaluation_type,
        summary,
        score,
        resume_score,
        strengths,
        red_flags,
        recommendation,
        feedback,
        created_at,
        candidates!inner(
          id,
          candidate_info_id
        )
      `)
      .eq('job_id', jobId)
      .order('score', { ascending: false });

    if (error) {
      console.error('Error fetching evaluations:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch evaluations' 
      }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedEvaluations = (evaluations || []).map((evaluation: any) => ({
      id: evaluation.id,
      candidateId: evaluation.candidate_id,
      candidateName: `${evaluation.candidates.first_name} ${evaluation.candidates.last_name || ''}`.trim(),
      candidateEmail: evaluation.candidates.email,
      evaluationType: evaluation.evaluation_type,
      summary: evaluation.summary,
      score: evaluation.score,
      resumeScore: evaluation.resume_score,
      strengths: evaluation.strengths || [],
      redFlags: evaluation.red_flags || [],
      recommendation: evaluation.recommendation,
      feedback: evaluation.feedback,
      createdAt: evaluation.created_at
    }));

    return NextResponse.json({
      success: true,
      evaluations: transformedEvaluations
    });
  } catch (error) {
    console.error('Error in evaluations API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 