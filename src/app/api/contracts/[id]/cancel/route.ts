import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractOfferId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to verify company access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or company not found' },
        { status: 404 },
      );
    }

    // Fetch the contract offer with related data to verify access
    const { data: contractOffer, error: contractOfferError } = await supabase
      .from('contract_offers_comprehensive')
      .select('*')
      .eq('id', contractOfferId)
      .eq('company_id', profile.company_id)
      .single();

    if (contractOfferError || !contractOffer) {
      return NextResponse.json(
        { success: false, error: 'Contract offer not found or access denied' },
        { status: 404 },
      );
    }

    // Check if the contract offer can be canceled (only sent offers can be canceled)
    if (contractOffer.status !== 'sent') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel contract offer with status '${contractOffer.status}'. Only sent offers can be canceled.`,
        },
        { status: 400 },
      );
    }

    // Update the contract offer status to 'expired' (using expired as canceled status)
    const { data: updatedOffer, error: updateError } = await supabase
      .from('contract_offers')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractOfferId)
      .select()
      .single();

    if (updateError) {
      console.error('Error canceling contract offer:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel contract offer' },
        { status: 500 },
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contract offer canceled successfully',
      contractOffer: {
        id: updatedOffer.id,
        status: updatedOffer.status,
        candidateName: `${contractOffer.candidate_first_name} ${contractOffer.candidate_last_name}`,
        contractTitle: contractOffer.contract_title,
      },
    });
  } catch (error) {
    console.error('Contract cancellation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
