import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/questionService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/jobs/[id]/questions/reorder - Reorder questions
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    const { questionIds } = await request.json();

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    if (!Array.isArray(questionIds)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question IDs array is required' 
      }, { status: 400 });
    }

    const success = await questionService.reorderQuestions(jobId, questionIds);

    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to reorder questions' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Questions reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering questions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to reorder questions' 
    }, { status: 500 });
  }
} 