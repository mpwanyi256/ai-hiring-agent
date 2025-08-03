import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profile ID is required',
        },
        { status: 400 },
      );
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get jobs with pagination and search
    const result = await jobsService.getJobsPaginated({
      profileId,
      limit,
      offset,
      search,
      status,
    });

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profileId,
      title,
      fields,
      interviewFormat,
      departmentId,
      jobTitleId,
      employmentTypeId,
      workplaceType,
      jobType,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
    } = body;

    // Validate required fields
    if (
      !profileId ||
      !title ||
      !interviewFormat ||
      !departmentId ||
      !jobTitleId ||
      !employmentTypeId ||
      !workplaceType ||
      !jobType
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: profileId, title, interviewFormat, departmentId, jobTitleId, employmentTypeId, workplaceType, and jobType are required',
        },
        { status: 400 },
      );
    }

    // Validate interview format
    if (!['text', 'video'].includes(interviewFormat)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid interview format. Must be "text" or "video"',
        },
        { status: 400 },
      );
    }

    // Validate salary range if provided
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum salary cannot be greater than maximum salary',
        },
        { status: 400 },
      );
    }

    // Enforce subscription and job limit checks
    const supabase = await createClient();
    // Get user details (subscription and usage)
    const { data: userDetails, error: userError } = await supabase
      .from('user_details')
      .select('subscription_status, max_jobs, active_jobs_count')
      .eq('id', profileId)
      .single();

    if (userError || !userDetails) {
      console.error('User details error:', userError);
      return NextResponse.json(
        {
          success: false,
          error: 'Could not verify user subscription. Please try again.',
        },
        { status: 403 },
      );
    }

    if (!['active', 'trialing'].includes(userDetails.subscription_status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'You need an active subscription to create a job. Please subscribe to a plan.',
        },
        { status: 403 },
      );
    }

    if (userDetails.max_jobs !== -1 && userDetails.active_jobs_count >= userDetails.max_jobs) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You have reached your job posting limit. Please upgrade your plan to create more jobs.',
        },
        { status: 403 },
      );
    }

    // Create new job using the Supabase service
    const newJob = await jobsService.createJob({
      profileId,
      title,
      fields: fields || {},
      interviewFormat,
      departmentId,
      jobTitleId,
      employmentTypeId,
      workplaceType,
      jobType,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
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
      { status: 500 },
    );
  }
}
