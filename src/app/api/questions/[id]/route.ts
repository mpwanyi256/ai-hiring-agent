import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/questionService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/questions/[id] - Update a question
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: questionId } = await params;
    const updates = await request.json();

    if (!questionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question ID is required' 
      }, { status: 400 });
    }

    const updatedQuestion = await questionService.updateQuestion(questionId, updates);

    if (!updatedQuestion) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update question' 
    }, { status: 500 });
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: questionId } = await params;

    if (!questionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question ID is required' 
      }, { status: 400 });
    }

    const deleted = await questionService.deleteQuestion(questionId);

    if (!deleted) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete question' 
    }, { status: 500 });
  }
} 