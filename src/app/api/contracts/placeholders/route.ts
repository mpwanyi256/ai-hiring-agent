import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Fetch placeholders from database
    const { data, error } = await supabase.rpc('get_contract_placeholders_by_category', {
      category_filter: category,
    });

    if (error) {
      console.error('Error fetching contract placeholders:', error);
      return NextResponse.json({ error: 'Failed to fetch contract placeholders' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      placeholders: data || [],
    });
  } catch (error) {
    console.error('Error in placeholders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
