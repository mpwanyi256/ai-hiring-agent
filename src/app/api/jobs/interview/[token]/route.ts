import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Interview token is required',
        },
        { status: 400 }
      );
    }

    // Get job by interview token - this is publicly accessible
    const job = await jobsService.getJobByToken(token);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Interview not found or expired',
        },
        { status: 404 }
      );
    }

    // Only return public-safe job information
    const publicJobInfo = {
      id: job.id,
      title: job.title,
      fields: job.fields,
      interviewFormat: job.interviewFormat,
      interviewToken: job.interviewToken,
      isActive: job.isActive,
      status: job.status,
      candidateCount: job.candidateCount,
      // Remove sensitive information
      profileId: undefined, // Don't expose profile ID
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    return NextResponse.json({
      success: true,
      job: publicJobInfo,
    });
  } catch (error) {
    console.error('Error fetching job by token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interview',
      },
      { status: 500 }
    );
  }
} 