import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profile ID is required',
        },
        { status: 400 }
      );
    }

    // Get jobs for the specific profile using Supabase
    const jobs = await jobsService.getJobsByProfileId(profileId);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, title, fields, interviewFormat } = body;

    // Validate required fields
    if (!profileId || !title || !interviewFormat) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: profileId, title, and interviewFormat are required',
        },
        { status: 400 }
      );
    }

    // Validate interview format
    if (!['text', 'video'].includes(interviewFormat)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid interview format. Must be "text" or "video"',
        },
        { status: 400 }
      );
    }

    // Create new job using the Supabase service
    const newJob = await jobsService.createJob({
      profileId,
      title,
      fields: fields || {},
      interviewFormat,
    });

    console.log('Created new job:', {
      id: newJob.id,
      title: newJob.title,
      profileId: newJob.profileId,
      interviewToken: newJob.interviewToken,
    });

    return NextResponse.json({
      success: true,
      job: newJob,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job',
      },
      { status: 500 }
    );
  }
} 