import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractOfferEmail } from '@/lib/email/resend';
import { app } from '@/lib/constants';

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

    const sendData = await request.json();
    const { userInfo } = sendData;

    // Use profile data from thunk if available, otherwise fetch from DB
    let profile = userInfo;
    if (!profile) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id, email, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.company_id) {
        return NextResponse.json(
          { success: false, error: 'User profile or company not found' },
          { status: 404 },
        );
      }
      profile = profileData;
    }

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

    // Fetch the contract with related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        job_title:job_titles(id, name),
        employment_type:employment_types(id, name)
      `,
      )
      .eq('id', contractId)
      .eq('company_id', userInfo?.companyId || profile?.company_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found or access denied' },
        { status: 404 },
      );
    }

    // Fetch candidate details using the candidate_details view
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
      console.error('Candidate query error:', candidateError);
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Get job details to verify company ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('profile_id')
      .eq('id', candidate.job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Get profile to verify company
    const { data: jobProfile, error: jobProfileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', job.profile_id)
      .single();

    if (jobProfileError || !jobProfile) {
      return NextResponse.json({ success: false, error: 'Job profile not found' }, { status: 404 });
    }

    // Verify the candidate belongs to a job in the same company as the contract
    if (jobProfile.company_id !== contract.company_id) {
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
      contract: contractOffer.contract,
      candidate: {
        id: candidate.id,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
      },
      sentByProfile: contractOffer.sent_by_profile,
    };

    // Send email notification to candidate
    try {
      // Build CC list with sender and additional recipients
      const ccList = [profile.email]; // Always CC the sender
      if (sendData.ccEmails && Array.isArray(sendData.ccEmails)) {
        ccList.push(...sendData.ccEmails.filter((email: string) => email && email.trim()));
      }

      const emailResult = await sendContractOfferEmail({
        to: candidate.email,
        candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
        companyName: userInfo?.companyName || profile?.companyName || 'Company',
        jobTitle: candidate.job_title || 'Position',
        employmentType: contract.employment_type?.name || 'Full-time',
        startDate: sendData.startDate
          ? new Date(sendData.startDate).toLocaleDateString()
          : 'To be determined',
        salaryAmount: sendData.salaryAmount,
        salaryCurrency: sendData.salaryCurrency,
        expiresAt: expiresAt.toISOString(),
        signingLink,
        contactEmail: profile.email,
        cc: ccList,
      });

      if (!emailResult.success) {
        console.error('Failed to send contract offer email:', emailResult.error);
        // Continue anyway - the contract offer was created successfully
      } else {
        console.log('Contract offer email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending contract offer email:', emailError);
      // Continue anyway - the contract offer was created successfully
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
