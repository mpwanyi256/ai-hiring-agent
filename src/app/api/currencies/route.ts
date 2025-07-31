import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('id, code, name, symbol, decimal_places')
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching currencies:', error);
      return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
    }

    return NextResponse.json(currencies);
  } catch (error) {
    console.error('Error in currencies API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
