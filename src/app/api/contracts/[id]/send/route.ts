import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractOfferEmail } from '@/lib/email/resend';
import { app } from '@/lib/constants';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    // Get current user (for auth + fallback email)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sendData = await request.json();
    const { userInfo } = sendData;

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

    // Fetch candidate details (used for email). RLS will enforce access.
    const { data: candidate, error: candidateError } = await supabase
      .from('candidate_details')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        job_id,
        job_title,
        profile_id
      `,
      )
      .eq('id', sendData.candidateId)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Check for existing pending offers for this contract + candidate (business logic)
    const { data: existingOffers, error: existingError } = await supabase
      .from('contract_offers')
      .select('id, status')
      .eq('contract_id', contractId)
      .eq('candidate_id', sendData.candidateId)
      .order('created_at', { ascending: false });

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error while checking existing offers',
        },
        { status: 500 },
      );
    }

    const pendingOffers = existingOffers?.filter((offer) => offer.status === 'sent') || [];
    if (pendingOffers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A pending contract offer already exists for this candidate. Please wait for the candidate to respond or cancel the existing offer before sending a new one.',
        },
        { status: 409 },
      );
    }

    // Generate a secure signing token
    const signingToken = crypto.randomUUID();

    // Set expiration date (e.g., 1 week from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the contract offer (RLS ensures permissions)
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
        id, contract_id, candidate_id, status, sent_by, sent_at, signing_token, expires_at,
        salary_amount, salary_currency, start_date, end_date, additional_terms, created_at, updated_at,
        sent_by_profile:profiles!contract_offers_sent_by_fkey(
          id, first_name, last_name, email
        )
      `,
      )
      .single();

    if (createError || !contractOffer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create contract offer',
          details: createError?.message || 'Unknown error',
        },
        { status: 500 },
      );
    }

    // Generate the public signing link
    const signingLink = `${app.baseUrl}/contract/${contractOffer.id}/sign?token=${signingToken}`;

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
      sentByProfile: contractOffer.sent_by_profile,
    };

    // Send email notification to candidate (best-effort)
    try {
      const ccList: string[] = [];
      if (sendData.ccEmails && Array.isArray(sendData.ccEmails)) {
        ccList.push(...sendData.ccEmails.filter((email: string) => email && email.trim()));
      }
      if (userInfo?.email) ccList.unshift(userInfo.email); // CC sender from auth slice

      await sendContractOfferEmail({
        to: candidate.email,
        candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
        companyName: userInfo?.companyName || 'Company',
        jobTitle: candidate.job_title || 'Position',
        employmentType: 'Full-time',
        startDate: sendData.startDate
          ? new Date(sendData.startDate).toLocaleDateString()
          : 'To be determined',
        salaryAmount: sendData.salaryAmount,
        salaryCurrency: sendData.salaryCurrency,
        expiresAt: expiresAt.toISOString(),
        signingLink,
        contactEmail: userInfo?.email || user.email || 'noreply@example.com',
        cc: ccList,
      });
    } catch (emailError) {
      // Log and continue
      console.error('Error sending contract offer email:', emailError);
    }

    return NextResponse.json({
      success: true,
      contractOffer: transformedContractOffer,
      signingLink,
      emailSent: true,
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
