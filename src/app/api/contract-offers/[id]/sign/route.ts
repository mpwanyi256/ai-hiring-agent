import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractSignedEmail, sendContractRejectedEmail } from '@/lib/email/resend';
import { generateAndSaveContractPDF } from '@/lib/pdf/generator';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Signing token is required' }, { status: 400 });
    }

    // Fetch contract offer with all related data for signing
    const { data: contractOffer, error } = await supabase
      .from('contract_offers')
      .select(
        `
        *,
        contract:contracts(
          id, title, body,
          job_title:job_titles(id, name),
          employment_type:employment_types(id, name),
          company:companies!contracts_company_id_fkey(id, name, slug)
        ),
        candidate:candidates(
          id, first_name, last_name, email,
          job:jobs!candidates_job_id_fkey(id, title)
        )
      `,
      )
      .eq('id', offerId)
      .eq('signing_token', token)
      .single();

    if (error || !contractOffer) {
      return NextResponse.json(
        { error: 'Invalid signing link or contract offer not found' },
        { status: 404 },
      );
    }

    // Check if the signing link has expired
    const expiresAt = new Date(contractOffer.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json({ error: 'This signing link has expired' }, { status: 410 });
    }

    // Check if already signed or rejected
    if (contractOffer.status !== 'sent') {
      return NextResponse.json(
        {
          error: `This contract has already been ${contractOffer.status}`,
          status: contractOffer.status,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      contractOffer,
    });
  } catch (error) {
    console.error('Error fetching contract offer for signing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { action, signingToken, rejectionReason } = body;

    if (!action || !signingToken) {
      return NextResponse.json({ error: 'Action and signing token are required' }, { status: 400 });
    }

    if (!['sign', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "sign" or "reject"' },
        { status: 400 },
      );
    }

    // Fetch contract offer with all related data
    const { data: contractOffer, error: fetchError } = await supabase
      .from('contract_offers')
      .select(
        `
        *,
        contract:contracts(
          id, title, body,
          job_title:job_titles(id, name),
          employment_type:employment_types(id, name),
          company:companies!contracts_company_id_fkey(id, name, slug)
        ),
        candidate:candidates(
          id, first_name, last_name, email,
          job:jobs!candidates_job_id_fkey(id, title)
        ),
        sent_by_profile:profiles!contract_offers_sent_by_fkey(
          id, email, first_name, last_name,
          company:companies!profiles_company_id_fkey(id, name, slug)
        )
      `,
      )
      .eq('id', offerId)
      .eq('signing_token', signingToken)
      .single();

    if (fetchError || !contractOffer) {
      return NextResponse.json(
        { error: 'Invalid signing token or contract offer not found' },
        { status: 404 },
      );
    }

    // Check if the signing link has expired
    const expiresAt = new Date(contractOffer.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      return NextResponse.json({ error: 'This signing link has expired' }, { status: 410 });
    }

    // Check if already processed
    if (contractOffer.status !== 'sent') {
      return NextResponse.json(
        {
          error: `This contract has already been ${contractOffer.status}`,
          status: contractOffer.status,
        },
        { status: 409 },
      );
    }

    let updateData: any = {};
    let pdfPath: string | undefined;
    let pdfUrl: string | undefined;

    if (action === 'sign') {
      updateData = {
        status: 'signed',
        signed_at: new Date().toISOString(),
      };

      // Generate and save signed contract PDF
      try {
        const pdfResult = await generateAndSaveContractPDF({
          contractOffer,
          contractHtml: contractOffer.contract.body,
          candidateData: contractOffer.candidate,
          companyData: contractOffer.contract.company,
        });

        if (pdfResult.success) {
          updateData.signed_copy_url = pdfResult.pdfUrl;
          pdfPath = pdfResult.pdfPath;
          pdfUrl = pdfResult.pdfUrl;
        } else {
          console.error('Failed to generate PDF:', pdfResult.error);
          // Continue without PDF - we can generate it later
        }
      } catch (pdfError) {
        console.error('Error generating contract PDF:', pdfError);
        // Continue without PDF
      }
    } else if (action === 'reject') {
      updateData = {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      };
    }

    // Update the contract offer status
    const { data: updatedOffer, error: updateError } = await supabase
      .from('contract_offers')
      .update(updateData)
      .eq('id', offerId)
      .eq('signing_token', signingToken)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract offer:', updateError);
      return NextResponse.json({ error: 'Failed to update contract status' }, { status: 500 });
    }

    // Send email notifications
    try {
      const candidateName =
        `${contractOffer.candidate.first_name || ''} ${contractOffer.candidate.last_name || ''}`.trim();
      const companyName = contractOffer.contract.company.name;
      const jobTitle = contractOffer.candidate.job?.title || 'Position';
      const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contracts`;

      // Prepare email recipients (sender + company admin emails)
      const emailRecipients = [contractOffer.sent_by_profile.email];

      if (action === 'sign') {
        // Send signed contract notification
        const emailResult = await sendContractSignedEmail({
          to: emailRecipients,
          candidateName,
          candidateEmail: contractOffer.candidate.email,
          companyName,
          jobTitle,
          startDate: contractOffer.start_date || 'To be determined',
          signedAt: updatedOffer.signed_at,
          dashboardLink,
          attachmentPath: pdfPath, // Include PDF if available
        });

        if (!emailResult.success) {
          console.error('Failed to send contract signed email:', emailResult.error);
        }

        // Also send a copy to the candidate
        await sendContractSignedEmail({
          to: contractOffer.candidate.email,
          candidateName,
          candidateEmail: contractOffer.candidate.email,
          companyName,
          jobTitle,
          startDate: contractOffer.start_date || 'To be determined',
          signedAt: updatedOffer.signed_at,
          dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/onboard/create-account/${offerId}`,
          attachmentPath: pdfPath,
        });

        // TODO: Create employment record automatically
        // This could be done here or as a separate workflow
        console.log('Contract signed - employment record creation needed');
      } else if (action === 'reject') {
        // Send rejection notification
        const emailResult = await sendContractRejectedEmail({
          to: emailRecipients,
          candidateName,
          candidateEmail: contractOffer.candidate.email,
          companyName,
          jobTitle,
          rejectedAt: updatedOffer.rejected_at,
          rejectionReason,
          dashboardLink,
        });

        if (!emailResult.success) {
          console.error('Failed to send contract rejected email:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Continue - the contract status was updated successfully
    }

    return NextResponse.json({
      success: true,
      contractOffer: updatedOffer,
      action,
      pdfUrl,
      redirectUrl:
        action === 'sign'
          ? `${process.env.NEXT_PUBLIC_APP_URL}/onboard/create-account/${offerId}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/contract/${offerId}/declined`,
    });
  } catch (error) {
    console.error('Error in contract signing API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
