import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    if (!company_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company ID is required',
        },
        { status: 400 },
      );
    }

    // Get jobs with pagination and search
    const result = await jobsService.getCompanyJobs({
      company_id,
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json({
      success: true,
      data: result,
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
