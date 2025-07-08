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
    type SupabaseResponse = {
      id: string;
      job_question_id: string;
      answer: string;
      response_time: number;
      created_at: string;
      job_questions?: Array<{
        question_text?: string;
        question_type?: string;
        order_index?: number;
      }>;
    };
    const transformedResponses = (responses || [])
      .map((response: SupabaseResponse) => {
        const jobQuestion = response.job_questions?.[0];
        return {
          id: response.id,
          questionId: response.job_question_id,
          questionText: jobQuestion?.question_text,
          questionType: jobQuestion?.question_type,
          responseText: response.answer,
          responseTime: response.response_time,
          orderIndex: jobQuestion?.order_index,
          createdAt: response.created_at
        };
      })
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