import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '@/lib/services/jobsService';
import { AppRequestParams } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: AppRequestParams<{ companySlug: string }>,
) {
  const { companySlug } = await params;
  const jobs = await jobsService.getJobsByCompanySlug(companySlug);
  if (!jobs) return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
  return NextResponse.json({ data: jobs });
}
