import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ClientCompany } from '@/types/company';
import { SupabaseResponse } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = <SupabaseResponse<ClientCompany>>(
      await supabase.from('companies').select('*').eq('id', id).maybeSingle()
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
