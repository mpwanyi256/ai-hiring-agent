import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!candidateId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate ID is required' 
      }, { status: 400 });
    }

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch responses for the candidate and job, joining job_questions
    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        id,
        job_question_id,
        answer,
        response_time,
        created_at,
        job_questions:job_question_id(
          id,
          question_text,
          question_type,
          order_index
        )
      `)
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId);

    if (error) {
      console.error('Error fetching responses:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch responses' 
      }, { status: 500 });
    }

    // Sort responses by order_index in JS
    const transformedResponses = (responses || [])
      .map((response: any) => ({
        id: response.id,
        questionId: response.job_question_id,
        questionText: response.job_questions?.question_text,
        questionType: response.job_questions?.question_type,
        responseText: response.answer,
        responseTime: response.response_time,
        orderIndex: response.job_questions?.order_index,
        createdAt: response.created_at
      }))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    return NextResponse.json({
      success: true,
      responses: transformedResponses
    });
  } catch (error) {
    console.error('Error in responses API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 