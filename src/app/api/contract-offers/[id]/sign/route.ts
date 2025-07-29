import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SignContractData } from '@/types/contracts';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Signing token is required' },
        { status: 400 },
      );
    }

    // Use service role client to access contract offers with token (anonymous access)
    const supabase = await createClient();

    // Fetch the contract offer with token validation
    const { data: contractOffer, error } = await supabase
      .from('contract_offers')
      .select(
        `
        *,
        contract:contracts(
          id, title, body, contract_duration,
          job_title:job_titles(id, name),
          employment_type:employment_types(id, name),
          company:companies(id, name, slug)
        ),
        candidate:candidates(
          id,
          candidate_info:candidates_info(
            id, first_name, last_name, email
          ),
          job:jobs(
            id, title
          )
        )
      `,
      )
      .eq('id', offerId)
      .eq('signing_token', token)
      .eq('status', 'sent')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !contractOffer) {
      return NextResponse.json(
        { success: false, error: 'Contract offer not found, expired, or already processed' },
        { status: 404 },
      );
    }

    // Transform the response
    const transformedOffer = {
      id: contractOffer.id,
      contractId: contractOffer.contract_id,
      candidateId: contractOffer.candidate_id,
      status: contractOffer.status,
      sentAt: contractOffer.sent_at,
      expiresAt: contractOffer.expires_at,
      salaryAmount: contractOffer.salary_amount,
      salaryCurrency: contractOffer.salary_currency,
      startDate: contractOffer.start_date,
      endDate: contractOffer.end_date,
      additionalTerms: contractOffer.additional_terms,
      contract: contractOffer.contract
        ? {
            id: contractOffer.contract.id,
            title: contractOffer.contract.title,
            body: contractOffer.contract.body,
            contractDuration: contractOffer.contract.contract_duration,
            jobTitle: contractOffer.contract.job_title
              ? {
                  id: contractOffer.contract.job_title.id,
                  name: contractOffer.contract.job_title.name,
                }
              : undefined,
            employmentType: contractOffer.contract.employment_type
              ? {
                  id: contractOffer.contract.employment_type.id,
                  name: contractOffer.contract.employment_type.name,
                }
              : undefined,
            company: contractOffer.contract.company
              ? {
                  id: contractOffer.contract.company.id,
                  name: contractOffer.contract.company.name,
                  slug: contractOffer.contract.company.slug,
                }
              : undefined,
          }
        : undefined,
      candidate: contractOffer.candidate
        ? {
            id: contractOffer.candidate.id,
            firstName: contractOffer.candidate.candidate_info?.first_name,
            lastName: contractOffer.candidate.candidate_info?.last_name,
            email: contractOffer.candidate.candidate_info?.email,
            job: contractOffer.candidate.job
              ? {
                  id: contractOffer.candidate.job.id,
                  title: contractOffer.candidate.job.title,
                }
              : undefined,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      contractOffer: transformedOffer,
    });
  } catch (error) {
    console.error('Error fetching contract offer for signing:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const signData: SignContractData = await request.json();

    // Validate required fields
    if (!signData.signingToken) {
      return NextResponse.json(
        { success: false, error: 'Signing token is required' },
        { status: 400 },
      );
    }

    if (!signData.action || !['sign', 'reject'].includes(signData.action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "sign" or "reject"' },
        { status: 400 },
      );
    }

    // Use service role client for anonymous access
    const supabase = await createClient();

    // First verify the contract offer exists and is valid
    const { data: existingOffer, error: fetchError } = await supabase
      .from('contract_offers')
      .select('id, status, expires_at, candidate_id')
      .eq('id', offerId)
      .eq('signing_token', signData.signingToken)
      .eq('status', 'sent')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { success: false, error: 'Contract offer not found, expired, or already processed' },
        { status: 404 },
      );
    }

    // Prepare update data based on action
    const updateData: any = {};
    if (signData.action === 'sign') {
      updateData.status = 'signed';
      updateData.signed_at = new Date().toISOString();
    } else if (signData.action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejected_at = new Date().toISOString();
    }

    // Update the contract offer
    const { data: updatedOffer, error: updateError } = await supabase
      .from('contract_offers')
      .update(updateData)
      .eq('id', offerId)
      .eq('signing_token', signData.signingToken)
      .select(
        `
        *,
        contract:contracts(
          id, title, body, contract_duration,
          job_title:job_titles(id, name),
          employment_type:employment_types(id, name),
          company:companies(id, name, slug)
        ),
        candidate:candidates(
          id,
          candidate_info:candidates_info(
            id, first_name, last_name, email
          ),
          job:jobs(
            id, title
          )
        )
      `,
      )
      .single();

    if (updateError) {
      console.error('Error updating contract offer:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // If contract was signed, create employment record
    let redirectUrl = '/contract/completed';
    if (signData.action === 'sign') {
      // TODO: Create employment record
      // This would happen in a separate service or background process
      // to handle user account creation and employment setup

      redirectUrl = `/onboard/create-account/${offerId}`;

      // TODO: Send signed contract email notification
      // This would integrate with your email service
    }

    // Transform the response
    const transformedOffer = {
      id: updatedOffer.id,
      contractId: updatedOffer.contract_id,
      candidateId: updatedOffer.candidate_id,
      status: updatedOffer.status,
      sentAt: updatedOffer.sent_at,
      signedAt: updatedOffer.signed_at,
      rejectedAt: updatedOffer.rejected_at,
      expiresAt: updatedOffer.expires_at,
      salaryAmount: updatedOffer.salary_amount,
      salaryCurrency: updatedOffer.salary_currency,
      startDate: updatedOffer.start_date,
      endDate: updatedOffer.end_date,
      additionalTerms: updatedOffer.additional_terms,
      contract: updatedOffer.contract
        ? {
            id: updatedOffer.contract.id,
            title: updatedOffer.contract.title,
            body: updatedOffer.contract.body,
            contractDuration: updatedOffer.contract.contract_duration,
            jobTitle: updatedOffer.contract.job_title
              ? {
                  id: updatedOffer.contract.job_title.id,
                  name: updatedOffer.contract.job_title.name,
                }
              : undefined,
            employmentType: updatedOffer.contract.employment_type
              ? {
                  id: updatedOffer.contract.employment_type.id,
                  name: updatedOffer.contract.employment_type.name,
                }
              : undefined,
            company: updatedOffer.contract.company
              ? {
                  id: updatedOffer.contract.company.id,
                  name: updatedOffer.contract.company.name,
                  slug: updatedOffer.contract.company.slug,
                }
              : undefined,
          }
        : undefined,
      candidate: updatedOffer.candidate
        ? {
            id: updatedOffer.candidate.id,
            firstName: updatedOffer.candidate.candidate_info?.first_name,
            lastName: updatedOffer.candidate.candidate_info?.last_name,
            email: updatedOffer.candidate.candidate_info?.email,
            job: updatedOffer.candidate.job
              ? {
                  id: updatedOffer.candidate.job.id,
                  title: updatedOffer.candidate.job.title,
                }
              : undefined,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      contractOffer: transformedOffer,
      redirectUrl,
    });
  } catch (error) {
    console.error('Error processing contract signature:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
