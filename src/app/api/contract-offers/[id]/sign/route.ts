import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendContractSignedEmail,
  sendContractRejectedEmail,
  sendCandidateContractConfirmation,
} from '@/lib/email/resend';
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

    // Fetch contract offer with all related data using the view
    const { data: contractOffer, error } = await supabase
      .from('contract_offer_details')
      .select('*')
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
    const { action, token, signingToken, rejectionReason, signature } = body;

    // Support both 'token' and 'signingToken' for backward compatibility
    const actualToken = token || signingToken;

    if (!actualToken) {
      return NextResponse.json({ error: 'Signing token is required' }, { status: 400 });
    }

    // If no action is specified, assume 'sign' (for new signature flow)
    const contractAction = action || 'sign';

    if (!['sign', 'reject'].includes(contractAction)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "sign" or "reject"' },
        { status: 400 },
      );
    }

    // Fetch contract offer with all related data using the view
    const { data: contractOffer, error: fetchError } = await supabase
      .from('contract_offer_details')
      .select('*')
      .eq('id', offerId)
      .eq('signing_token', actualToken)
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

    if (contractAction === 'sign') {
      updateData = {
        status: 'signed',
        signed_at: new Date().toISOString(),
      };

      // Store signature data if provided
      if (signature) {
        updateData.additional_terms = {
          ...contractOffer.additional_terms,
          signature: {
            type: signature.type,
            data: signature.data,
            fullName: signature.fullName,
            signedAt: signature.signedAt || new Date().toISOString(),
          },
        };
      }

      // Generate and save signed contract PDF
      try {
        // Auto-fill the contract body with signature before generating PDF
        const autoFillPlaceholders = (contractBody: string, data: any): string => {
          if (!contractBody) return contractBody;

          // Check if contract has signature data
          const signatureData = data.additional_terms?.signature;
          let signatureHtml = '';

          if (signatureData) {
            if (signatureData.type === 'typed') {
              signatureHtml = `
                <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Digital Signature:</p>
                  <div style="font-family: 'Brush Script MT', cursive; font-size: 24px; font-style: italic; color: #000; padding: 10px; background-color: white; border: 1px solid #ccc; border-radius: 3px;">
                    ${signatureData.fullName}
                  </div>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Signed on: ${new Date(signatureData.signedAt).toLocaleDateString()}</p>
                </div>
              `;
            } else if (signatureData.type === 'drawn') {
              signatureHtml = `
                <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Digital Signature:</p>
                  <div style="padding: 10px; background-color: white; border: 1px solid #ccc; border-radius: 3px;">
                    <img src="${signatureData.data}" alt="Signature" style="max-width: 300px; max-height: 100px; display: block;" />
                  </div>
                  <p style="margin: 10px 0 5px 0; font-size: 14px; color: #333;">Name: ${signatureData.fullName}</p>
                  <p style="margin: 0; font-size: 12px; color: #666;">Signed on: ${new Date(signatureData.signedAt).toLocaleDateString()}</p>
                </div>
              `;
            }
          }

          const placeholders = {
            '{{ candidate_name }}':
              `${data.candidate_first_name || ''} ${data.candidate_last_name || ''}`.trim(),
            '{{ candidate_first_name }}': data.candidate_first_name || '',
            '{{ candidate_last_name }}': data.candidate_last_name || '',
            '{{ candidate_email }}': data.candidate_email || '',
            '{{ job_title }}': data.job_title_name || 'Position',
            '{{ employment_type }}': data.employment_type_name || 'Full-time',
            '{{ company_name }}': data.company_name || 'Company',
            '{{ salary_amount }}': data.salary_amount
              ? `$${Number(data.salary_amount).toLocaleString()}`
              : '$0',
            '{{ salary_currency }}': data.salary_currency || 'USD',
            '{{ start_date }}': data.start_date
              ? new Date(data.start_date).toLocaleDateString()
              : 'TBD',
            '{{ end_date }}': data.end_date
              ? new Date(data.end_date).toLocaleDateString()
              : 'Indefinite',
            '{{ signing_date }}': new Date().toLocaleDateString(),
            '{{ sender_name }}':
              `${data.sender_first_name || ''} ${data.sender_last_name || ''}`.trim(),
            '{{ sender_email }}': data.sender_email || '',
            '{{ candidate_signature }}': signatureHtml,
          };

          let filledBody = contractBody;
          Object.entries(placeholders).forEach(([placeholder, value]) => {
            const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi');
            filledBody = filledBody.replace(regex, value);
          });

          return filledBody;
        };

        const filledContractHtml = autoFillPlaceholders(contractOffer.contract_body, contractOffer);

        const pdfResult = await generateAndSaveContractPDF({
          contractOffer,
          contractHtml: filledContractHtml,
          candidateData: {
            id: contractOffer.candidate_id,
            first_name: contractOffer.candidate_first_name,
            last_name: contractOffer.candidate_last_name,
            email: contractOffer.candidate_email,
          },
          companyData: {
            name: contractOffer.company_name,
          },
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
      .eq('signing_token', actualToken)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract offer:', updateError);
      return NextResponse.json({ error: 'Failed to update contract status' }, { status: 500 });
    }

    // Send email notifications
    try {
      const candidateName =
        `${contractOffer.candidate_first_name || ''} ${contractOffer.candidate_last_name || ''}`.trim();
      const companyName = contractOffer.company_name;
      const jobTitle = contractOffer.job_title_name || 'Position';
      const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contracts`;

      // Prepare email recipients (sender + company admin emails)
      const emailRecipients = [contractOffer.sender_email];

      if (contractAction === 'sign') {
        // Send signed contract notification
        const emailResult = await sendContractSignedEmail({
          to: emailRecipients,
          candidateName,
          candidateEmail: contractOffer.candidate_email,
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

        // Send confirmation email to candidate with download link
        const downloadLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/contract-offers/${offerId}/download?token=${contractOffer.signing_token}`;

        await sendCandidateContractConfirmation({
          to: contractOffer.candidate_email,
          candidateName,
          companyName,
          jobTitle,
          startDate: contractOffer.start_date || 'To be determined',
          signedAt: updatedOffer.signed_at,
          downloadLink,
          attachmentPath: pdfPath,
        });

        // TODO: Create employment record automatically
        // This could be done here or as a separate workflow
        console.log('Contract signed - employment record creation needed');
      } else if (contractAction === 'reject') {
        // Send rejection notification
        const emailResult = await sendContractRejectedEmail({
          to: emailRecipients,
          candidateName,
          candidateEmail: contractOffer.candidate_email,
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
