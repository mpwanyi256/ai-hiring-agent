import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BulkUpdateContractData, ContractStatus, ContractCategory } from '@/types/contracts';

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

    const body: BulkUpdateContractData = await request.json();
    const { contractIds, updates } = body;

    // Validate input
    if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json(
        { error: 'Contract IDs array is required and cannot be empty' },
        { status: 400 },
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Updates object is required and cannot be empty' },
        { status: 400 },
      );
    }

    // Validate contract IDs belong to the user's company
    const { data: contractsToUpdate, error: validateError } = await supabase
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

    const validContractIds = contractsToUpdate?.map((c) => c.id) || [];
    const invalidIds = contractIds.filter((id) => !validContractIds.includes(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: 'Some contracts do not exist or do not belong to your company',
          invalidIds,
        },
        { status: 403 },
      );
    }

    // Use the database function for bulk update
    const { data: updateResult, error: updateError } = await supabase.rpc('bulk_update_contracts', {
      p_company_id: profile.company_id,
      p_contract_ids: contractIds,
      p_status: updates.status || null,
      p_category: updates.category || null,
      p_is_favorite: updates.isFavorite !== undefined ? updates.isFavorite : null,
      p_tags: updates.tags || null,
    });

    if (updateError) {
      console.error('Bulk update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contracts', details: updateError.message },
        { status: 500 },
      );
    }

    const affectedCount = updateResult || 0;

    return NextResponse.json({
      success: true,
      affected: affectedCount,
      message: `Successfully updated ${affectedCount} contract${affectedCount !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error in bulk update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
