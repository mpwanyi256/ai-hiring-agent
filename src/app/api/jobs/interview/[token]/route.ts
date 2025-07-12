import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Interview token is required',
        },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Check if the job is in interviewing status
    if (job.status !== 'interviewing') {
      return NextResponse.json(
        {
          success: false,
          error:
            job.status === 'draft'
              ? 'This interview is not yet available. Please check back later.'
              : 'This interview has been closed and is no longer accepting candidates.',
        },
        { status: 403 },
      );
    }

    // Check if the job is active
    if (!job.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'This interview is currently inactive',
        },
        { status: 403 },
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
      profileId: job.profileId,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      companySlug: job.companySlug,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      jobType: job.jobType,
    };

    return NextResponse.json({
      success: true,
      data: publicJobInfo,
    });
  } catch (error) {
    console.error('Error fetching job by token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch interview',
      },
      { status: 500 },
    );
  }
}
