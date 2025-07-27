import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Use the database function to get platform statistics
    // RLS policies will handle admin access verification
    const { data: stats, error: statsError } = await supabase.rpc('get_platform_statistics');

    if (statsError) {
      console.error('Error fetching platform stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch platform statistics' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Platform stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
