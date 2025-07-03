import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jobsService } from '@/lib/services/jobsService';
import { v4 as uuidv4 } from 'uuid';

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

    const supabase = await createClient();

    // Create a temporary candidate session ID
    const candidateId = uuidv4();

    // For now, we'll track the candidate session in memory/locally
    // In a full implementation, you might want to create a candidate_sessions table
    // or use the profiles table with a 'candidate' role

    const session = {
      candidate: {
        id: candidateId,
        jobId: job.id,
        interviewToken: jobToken,
        email: candidateData?.email || null,
        firstName: candidateData?.firstName || null,
        lastName: candidateData?.lastName || null,
        currentStep: 1,
        totalSteps: 0, // Will be determined by number of questions
        isCompleted: false,
        submittedAt: null,
        createdAt: new Date().toISOString()
      },
      job: {
        id: job.id,
        title: job.title,
        interviewFormat: job.interviewFormat
      },
      startedAt: new Date().toISOString()
    };

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