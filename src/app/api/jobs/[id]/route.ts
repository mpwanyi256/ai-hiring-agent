import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      );
    }

    const job = await jobsService.getJobById(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      );
    }

    // Validate interview format if provided
    if (body.interviewFormat && !['text', 'video'].includes(body.interviewFormat)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid interview format. Must be "text" or "video"',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !['draft', 'interviewing', 'closed'].includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be "draft", "interviewing", or "closed"',
        },
        { status: 400 }
      );
    }

    // Prepare update data with proper typing
    interface UpdateData {
      title?: string;
      fields?: {
        skills?: string[];
        experienceLevel?: string;
        traits?: string[];
        jobDescription?: string;
        customFields?: Record<string, { value: string; inputType: string }>;
      };
      interviewFormat?: 'text' | 'video';
      status?: 'draft' | 'interviewing' | 'closed';
      isActive?: boolean;
    }

    const updateData: UpdateData = {};

    // Add fields to update data if they exist in the request body
    if (body.title) updateData.title = body.title;
    if (body.fields) updateData.fields = body.fields;
    if (body.interviewFormat) updateData.interviewFormat = body.interviewFormat;
    if (body.status) updateData.status = body.status;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Special handling for status changes
    if (body.status === 'closed') {
      updateData.isActive = false; // Automatically set is_active to false when job is closed
    } else {
      updateData.isActive = true;
    }

    // Update the job using the Supabase service
    const updatedJob = await jobsService.updateJob(jobId, updateData);

    if (!updatedJob) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      );
    }

    const success = await jobsService.deleteJob(jobId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    console.log('Deleted job:', {
      id: jobId,
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete job',
      },
      { status: 500 }
    );
  }
} 