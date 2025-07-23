import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }
    const offset = (page - 1) * limit;
    const supabase = await createClient();
    // Fetch invites from invites table
    const {
      data: invites,
      error,
      count,
    } = await supabase
      .from('invites')
      .select('id, email, first_name, last_name, role, status, expires_at, created_at', {
        count: 'exact',
      })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const totalCount = count || 0;
    const hasMore = offset + invites.length < totalCount;
    return NextResponse.json({ invites, hasMore, totalCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
