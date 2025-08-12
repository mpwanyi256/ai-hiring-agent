import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateContractData } from '@/types/contracts';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the contract with relations
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(
        `
        *,
        job_title:job_titles(id, name),
        created_by_profile:profiles!contracts_created_by_fkey(
          id, first_name, last_name, email
        )
      `,
      )
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 });
    }

    // Transform the response
    const transformedContract = {
      id: contract.id,
      companyId: contract.company_id,
      jobTitleId: contract.job_title_id,
      title: contract.title,
      content: contract.content,
      status: contract.status,
      isFavorite: contract.is_favorite,
      createdBy: contract.created_by,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      jobTitle: contract.job_title
        ? {
            id: contract.job_title.id,
            name: contract.job_title.name,
          }
        : undefined,
      creator: contract.created_by_profile
        ? {
            firstName: contract.created_by_profile.first_name,
            lastName: contract.created_by_profile.last_name,
            email: contract.created_by_profile.email,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      contract: transformedContract,
    });
  } catch (error) {
    console.error('Error in contract GET API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData: Partial<UpdateContractData> = await request.json();

    // Validate required fields
    if (updateData.title !== undefined && !updateData.title) {
      return NextResponse.json({ success: false, error: 'Title cannot be empty' }, { status: 400 });
    }

    if (updateData.content !== undefined && !updateData.content) {
      return NextResponse.json(
        { success: false, error: 'Content cannot be empty' },
        { status: 400 },
      );
    }

    // Build update object
    const updateObj: any = {};
    if (updateData.title !== undefined) updateObj.title = updateData.title;
    if (updateData.content !== undefined) updateObj.content = updateData.content;
    if (updateData.jobTitleId !== undefined) updateObj.job_title_id = updateData.jobTitleId;
    // employmentTypeId removed from simplified model

    // Update the contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .update(updateObj)
      .eq('id', contractId)
      .select(
        `
        *,
        job_title:job_titles(id, name),
        created_by_profile:profiles!contracts_created_by_fkey(
          id, first_name, last_name, email
        )
      `,
      )
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 });
    }

    // Transform the response
    const transformedContract = {
      id: contract.id,
      companyId: contract.company_id,
      jobTitleId: contract.job_title_id,
      title: contract.title,
      content: contract.content,
      status: contract.status,
      isFavorite: contract.is_favorite,
      createdBy: contract.created_by,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      jobTitle: contract.job_title
        ? {
            id: contract.job_title.id,
            name: contract.job_title.name,
          }
        : undefined,
      creator: contract.created_by_profile
        ? {
            firstName: contract.created_by_profile.first_name,
            lastName: contract.created_by_profile.last_name,
            email: contract.created_by_profile.email,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      contract: transformedContract,
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if contract has any offers sent (prevent deletion if in use)
    const { data: offers, error: offersError } = await supabase
      .from('contract_offers')
      .select('id')
      .eq('contract_id', contractId)
      .limit(1);

    if (offersError) {
      console.error('Error checking contract offers:', offersError);
      return NextResponse.json({ success: false, error: offersError.message }, { status: 500 });
    }

    if (offers && offers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete contract that has been sent to candidates' },
        { status: 409 },
      );
    }

    // Delete the contract
    const { error } = await supabase.from('contracts').delete().eq('id', contractId);

    if (error) {
      console.error('Error deleting contract:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
