import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or company not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const sendData = body;

    // Validate required fields
    if (!sendData.candidateId || !sendData.salaryAmount || !sendData.salaryCurrency) {
      return NextResponse.json(
        {
          success: false,
          error: 'candidateId, salaryAmount, and salaryCurrency are required',
        },
        { status: 400 },
      );
    }

    // Fetch the contract to verify it exists and belongs to the user's company
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('company_id', profile.company_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found or access denied' },
        { status: 404 },
      );
    }

    // Fetch the candidate to verify they exist and belong to a job in the same company
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        job:jobs!candidates_job_id_fkey(
          id,
          title,
          profile:profiles!jobs_profile_id_fkey(company_id)
        )
      `,
      )
      .eq('id', sendData.candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Verify the candidate belongs to a job in the same company as the contract
    const candidateCompanyId = (candidate as any).job?.profile?.company_id;
    if (candidateCompanyId !== contract.company_id) {
      return NextResponse.json(
        { success: false, error: 'Candidate and contract must be from the same company' },
        { status: 403 },
      );
    }

    // Check if there's already a contract offer for this candidate
    const { data: existingOffer, error: existingError } = await supabase
      .from('contract_offers')
      .select('id, status')
      .eq('contract_id', contractId)
      .eq('candidate_id', sendData.candidateId)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing offers:', existingError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
        },
        { status: 500 },
      );
    }

    if (existingOffer && existingOffer.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Contract offer already exists for this candidate' },
        { status: 409 },
      );
    }

    // Generate a secure signing token
    const signingToken = crypto.randomUUID();

    // Set expiration date (e.g., 1 week from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the contract offer
    const { data: contractOffer, error: createError } = await supabase
      .from('contract_offers')
      .insert({
        contract_id: contractId,
        candidate_id: sendData.candidateId,
        salary_amount: sendData.salaryAmount,
        salary_currency: sendData.salaryCurrency || 'USD',
        start_date: sendData.startDate,
        end_date: sendData.endDate,
        additional_terms: sendData.additionalTerms || {},
        sent_by: user.id,
        status: 'sent',
        signing_token: signingToken,
        expires_at: expiresAt.toISOString(),
      })
      .select(
        `
        *,
        contract:contracts(
          id, title, body, job_title:job_titles(id, name),
          employment_type:employment_types(id, name)
        ),
        candidate:candidates(
          id, first_name, last_name, email
        ),
        sent_by_profile:profiles!contract_offers_sent_by_fkey(
          id, first_name, last_name, email
        )
      `,
      )
      .single();

    if (createError) {
      console.error('Error creating contract offer:', createError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create contract offer',
          details: createError.message,
        },
        { status: 500 },
      );
    }

    // Generate the public signing link
    const signingLink = `${process.env.NEXT_PUBLIC_APP_URL}/contract/${contractOffer.id}/sign?token=${signingToken}`;

    // Transform to match our TypeScript interface
    const transformedContractOffer = {
      id: contractOffer.id,
      contractId: contractOffer.contract_id,
      candidateId: contractOffer.candidate_id,
      status: contractOffer.status,
      sentBy: contractOffer.sent_by,
      sentAt: contractOffer.sent_at,
      signingToken: contractOffer.signing_token,
      expiresAt: contractOffer.expires_at,
      salaryAmount: contractOffer.salary_amount,
      salaryCurrency: contractOffer.salary_currency,
      startDate: contractOffer.start_date,
      endDate: contractOffer.end_date,
      additionalTerms: contractOffer.additional_terms,
      createdAt: contractOffer.created_at,
      updatedAt: contractOffer.updated_at,
      contract: contractOffer.contract,
      candidate: contractOffer.candidate,
      sentByProfile: contractOffer.sent_by_profile,
    };

    // TODO: Send email notification to candidate with signing link
    // This would integrate with your email service (Resend, SendGrid, etc.)
    console.log(`Contract offer created with signing link: ${signingLink}`);

    return NextResponse.json({
      success: true,
      contractOffer: transformedContractOffer,
      signingLink,
    });
  } catch (error) {
    console.error('Error in send contract API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
