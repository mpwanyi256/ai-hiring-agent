import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/questionService';

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

// GET /api/jobs/[id]/questions/[questionId] - Get a specific question
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { questionId } = await params;

    if (!questionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question ID is required' 
      }, { status: 400 });
    }

    // For now, we'll get all questions and find the specific one
    // In a real implementation, you might want a direct getQuestionById method
    const { id: jobId } = await params;
    const questions = await questionService.getQuestionsForJob(jobId);
    const question = questions.find(q => q.id === questionId);

    if (!question) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch question' 
    }, { status: 500 });
  }
}

// PUT /api/jobs/[id]/questions/[questionId] - Update a question
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { questionId } = await params;
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

// DELETE /api/jobs/[id]/questions/[questionId] - Delete a question
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { questionId } = await params;

    if (!questionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question ID is required' 
      }, { status: 400 });
    }

    const success = await questionService.deleteQuestion(questionId);

    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found or could not be deleted' 
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