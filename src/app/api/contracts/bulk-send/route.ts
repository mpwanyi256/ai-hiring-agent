import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractOfferEmail } from '@/lib/email/resend';
import { app } from '@/lib/constants';

interface BulkContractData {
  candidateIds: string[];
  contractData: {
    contractId: string;
    salaryAmount: number;
    salaryCurrency: string;
    startDate: string;
    customMessage?: string;
    ccEmails?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkContractData = await request.json();
    const { candidateIds, contractData } = body;

    if (!candidateIds || candidateIds.length === 0) {
      return NextResponse.json({ error: 'No candidates selected' }, { status: 400 });
    }

    if (!contractData.contractId || !contractData.salaryAmount || !contractData.startDate) {
      return NextResponse.json({ error: 'Missing required contract data' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify contract belongs to user's company
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        id,
        title,
        body,
        company_id,
        job_title:job_titles (
          name
        ),
        employment_type:employment_types (
          name
        )
      `,
      )
      .eq('id', contractData.contractId)
      .eq('company_id', profile.company_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    // Fetch all selected candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        job_title
      `,
      )
      .in('id', candidateIds);

    if (candidatesError || !candidates) {
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single();

    const companyName = company?.name || profile.companyName || 'Company';

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as { candidateId: string; candidateName: string; error: string }[],
    };

    // Process each candidate
    for (const candidate of candidates) {
      try {
        // Create contract offer
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

        const { data: contractOffer, error: offerError } = await supabase
          .from('contract_offers')
          .insert({
            contract_id: contractData.contractId,
            candidate_id: candidate.id,
            sent_by: user.id,
            salary_amount: contractData.salaryAmount,
            salary_currency: contractData.salaryCurrency,
            start_date: contractData.startDate,
            expires_at: expiresAt.toISOString(),
            additional_terms: contractData.customMessage
              ? { customMessage: contractData.customMessage }
              : {},
          })
          .select('id, signing_token')
          .single();

        if (offerError || !contractOffer) {
          throw new Error(`Failed to create contract offer: ${offerError?.message}`);
        }

        // Generate signing link
        const signingLink = `${app.baseUrl}/contract/${contractOffer.id}/sign?token=${contractOffer.signing_token}`;

        // Build CC list
        const ccList = [profile.email]; // Always CC the sender
        if (contractData.ccEmails && contractData.ccEmails.length > 0) {
          ccList.push(...contractData.ccEmails.filter((email) => email && email.trim()));
        }

        // Send email
        const emailResult = await sendContractOfferEmail({
          to: candidate.email,
          candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
          companyName,
          jobTitle: candidate.job_title || 'Position',
          employmentType: contract.employment_type?.name || 'Full-time',
          startDate: new Date(contractData.startDate).toLocaleDateString(),
          salaryAmount: contractData.salaryAmount,
          salaryCurrency: contractData.salaryCurrency,
          expiresAt: expiresAt.toISOString(),
          signingLink,
          contactEmail: profile.email,
          cc: ccList,
          customMessage: contractData.customMessage,
        });

        if (!emailResult.success) {
          throw new Error(`Failed to send email: ${emailResult.error}`);
        }

        results.successCount++;
      } catch (error) {
        console.error(`Error processing candidate ${candidate.id}:`, error);
        results.failureCount++;
        results.failures.push({
          candidateId: candidate.id,
          candidateName: `${candidate.first_name} ${candidate.last_name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk contract send completed`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk contract send:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
