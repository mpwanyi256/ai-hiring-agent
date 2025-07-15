import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';
import { AppRequestParams } from '@/types/api';

export async function GET(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const { id: company_id } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const result = await jobsService.getCompanyJobs({
      company_id,
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('There was an error fetching the jobs', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
