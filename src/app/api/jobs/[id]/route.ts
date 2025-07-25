import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';
import { createClient } from '@/lib/supabase/server';
import { checkJobPermission } from '@/lib/utils/jobPermissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view this job
    const hasPermission = await checkJobPermission(supabase, user.id, jobId);

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to access this job',
        },
        { status: 403 },
      );
    }

    const jobData = await jobsService.getJobById(jobId);

    if (!jobData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      job: jobData,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;

    // update job status
    const { status } = await request.json();

    const job = await jobsService.updateJobStatus(jobId, status);

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error updating job:', error);
  }
}
