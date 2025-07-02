import { NextResponse } from 'next/server';
import { interviewService } from '@/lib/services/interviewService';

export async function POST(request: Request) {
  try {
    const { candidateId, questionId, question, answer, responseTime } = await request.json();

    if (!candidateId || !questionId || !question || !answer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Submit response
    const response = await interviewService.submitResponse(
      candidateId,
      questionId, 
      question,
      answer,
      responseTime || 0
    );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit response' 
    }, { status: 500 });
  }
} 