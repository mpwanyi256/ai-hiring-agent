import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { contractIds } = body;

    // Validate input
    if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json(
        { error: 'Contract IDs array is required and cannot be empty' },
        { status: 400 },
      );
    }

    // Validate contract IDs belong to the user's company
    const { data: contractsToDelete, error: validateError } = await supabase
      .from('contracts')
      .select('id')
      .eq('company_id', profile.company_id)
      .in('id', contractIds);

    if (validateError) {
      console.error('Validation error:', validateError);
      return NextResponse.json(
        { error: 'Failed to validate contracts', details: validateError.message },
        { status: 500 },
      );
    }

    const validContractIds = contractsToDelete?.map((c) => c.id) || [];
    const invalidIds = contractIds.filter((id: string) => !validContractIds.includes(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: 'Some contracts do not exist or do not belong to your company',
          invalidIds,
        },
        { status: 403 },
      );
    }

    // Delete contracts (cascading will handle related records)
    const { error: deleteError, count } = await supabase
      .from('contracts')
      .delete()
      .eq('company_id', profile.company_id)
      .in('id', contractIds);

    if (deleteError) {
      console.error('Bulk delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete contracts', details: deleteError.message },
        { status: 500 },
      );
    }

    const deletedCount = count || 0;

    return NextResponse.json({
      success: true,
      affected: deletedCount,
      message: `Successfully deleted ${deletedCount} contract${deletedCount !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error in bulk delete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
