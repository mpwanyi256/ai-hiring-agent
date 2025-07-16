import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
  }

  // Query the view for this company
  const { data, error } = await supabase
    .from('company_candidate_pipeline')
    .select('status, count')
    .eq('company_id', companyId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Return as array of { status, count }
  const pipeline = (data || []).map((row) => ({
    status: row.status,
    count: row.count,
  }));

  return NextResponse.json({ success: true, pipeline });
}
