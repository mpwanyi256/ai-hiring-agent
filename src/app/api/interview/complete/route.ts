import { NextResponse } from 'next/server';
import { interviewService } from '@/lib/services/interviewService';

export async function POST(request: Request) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Candidate ID is required' 
      }, { status: 400 });
    }

    // Complete interview
    await interviewService.completeInterview(candidateId);

    return NextResponse.json({
      success: true,
      message: 'Interview completed successfully',
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to complete interview' 
    }, { status: 500 });
  }
} 