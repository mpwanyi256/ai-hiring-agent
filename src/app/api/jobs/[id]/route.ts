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

    console.log('jobId', jobId);

    // update job status
    const { status } = await request.json();
    const supabase = await createClient();

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('Error getting job:', jobError);
      return NextResponse.json({ success: false, error: jobError.message }, { status: 500 });
    }

    const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);

    if (error) {
      console.error('Error updating job:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error updating job:', error);
  }
}
