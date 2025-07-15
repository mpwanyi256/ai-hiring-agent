import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const candidateId = params.id;
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing status' }, { status: 400 });
    }
    const { data: candidate, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', candidateId)
      .select()
      .single();
    if (error || !candidate) {
      return NextResponse.json(
        { success: false, error: 'Failed to update candidate status' },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data: candidate });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
