import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id: candidateId } = await params;

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    // Get the current user to enforce auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch contract offers for this candidate from comprehensive view
    const { data: offers, error } = await supabase
      .from('contract_offers_comprehensive')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching contract offers for candidate:', error);
      return NextResponse.json({ error: 'Failed to fetch contract offers' }, { status: 500 });
    }

    // Fetch rejection reasons separately as view may not include them
    const { data: rejectionReasons, error: rejectionError } = await supabase
      .from('contract_offers')
      .select('id, rejection_reason')
      .in('id', offers?.map((o) => o.id) || []);

    if (rejectionError) {
      console.warn('Failed to fetch rejection reasons:', rejectionError);
    }

    const rejectionMap = new Map((rejectionReasons || []).map((r) => [r.id, r.rejection_reason]));

    // Transform to match OffersTab expectations
    const transformed = (offers || []).map((offer) => ({
      id: offer.id,
      candidateId: offer.candidate_id,
      contractId: offer.contract_id,
      status: offer.status,
      salaryAmount: offer.salary_amount,
      salaryCurrency: offer.salary_currency,
      startDate: offer.start_date,
      endDate: offer.end_date,
      expiresAt: offer.expires_at,
      sentAt: offer.sent_at,
      signedAt: offer.signed_at,
      rejectedAt: offer.rejected_at,
      rejectionReason: rejectionMap.get(offer.id) || null,
      signingToken: offer.signing_token,
      additionalTerms: offer.additional_terms,
      contractTitle: offer.contract_title,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (err) {
    console.error('Error in candidate contract offers route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
