import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AppRequestParams } from '@/types/api';

export async function PATCH(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update the contract status
    const { data, error } = await supabase
      .from('contracts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract status:', error);
      return NextResponse.json({ error: 'Failed to update contract status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contract: data,
    });
  } catch (error) {
    console.error('Contract status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
