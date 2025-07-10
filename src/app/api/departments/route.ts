import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ success: true, departments: data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch departments',
      },
      { status: 500 },
    );
  }
}
