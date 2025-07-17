import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Optionally check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  // Get companyId from query params
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
  }
  const status = searchParams.get('status'); // e.g. 'scheduled'
  const daysAhead = parseInt(searchParams.get('daysAhead') || '7');
  const limit = parseInt(searchParams.get('limit') || '10');
  const page = parseInt(searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  // Date range: today to today + daysAhead
  const today = new Date();
  const endDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  // Query the view
  let query = supabase
    .from('company_upcoming_interviews')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .gte('interview_date', todayStr)
    .lte('interview_date', endDateStr)
    .order('interview_date', { ascending: true })
    .order('interview_time', { ascending: true })
    .range(offset, offset + limit - 1);
  if (status) {
    query = query.eq('interview_status', status);
  }
  const { data: interviews, error, count } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, interviews, total: count });
}
