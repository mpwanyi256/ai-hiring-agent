import { NextResponse } from 'next/server';
import { interviewService } from '@/lib/services/interviewService';
import { jobsService } from '@/lib/services/jobsService';

export async function POST(request: Request) {
  try {
    const { jobToken, candidateData } = await request.json();

    if (!jobToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job token is required' 
      }, { status: 400 });
    }

    // Get job data
    const job = await jobsService.getJobByInterviewToken(jobToken);
    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid interview link' 
      }, { status: 404 });
    }

    // Create candidate
    const candidate = await interviewService.createCandidate(
      job.id, 
      jobToken, 
      candidateData
    );

    // Start interview session
    const session = await interviewService.startInterview(candidate.id, job);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to start interview' 
    }, { status: 500 });
  }
} 