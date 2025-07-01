import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('traits')
      .select('id, name, category, description')
      .eq('is_active', true)
      .order('name');

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: traits, error } = await query;

    if (error) {
      console.error('Error fetching traits:', error);
      return NextResponse.json({ error: 'Failed to fetch traits' }, { status: 500 });
    }

    return NextResponse.json({ traits });
  } catch (error) {
    console.error('Traits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 