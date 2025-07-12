import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { companySlug: string } }) {
  const { companySlug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .select('name, slug, logo_url, bio, created_at')
    .eq('slug', companySlug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
