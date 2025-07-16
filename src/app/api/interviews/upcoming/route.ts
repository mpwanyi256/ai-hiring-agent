import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  // Get user's company and profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('id', user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
  }
  // Get jobs for this employer
  const { data: jobs } = await supabase.from('jobs').select('id').eq('profile_id', profile.id);
  const jobIds = (jobs || []).map((j) => j.id);
  if (!jobIds.length) {
    return NextResponse.json({ success: true, interviews: [] });
  }
  // Get upcoming interviews for these jobs (next 7 days, not cancelled)
  const today = new Date();
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: interviews, error } = await supabase
    .from('interviews')
    .select(
      'id, job_id, application_id, date, time, status, candidate:application_id(first_name, last_name, email), job:job_id(title)',
    )
    .in('job_id', jobIds)
    .not('status', 'eq', 'cancelled')
    .gte('date', today.toISOString().slice(0, 10))
    .lte('date', sevenDaysLater.toISOString().slice(0, 10))
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, interviews });
}
