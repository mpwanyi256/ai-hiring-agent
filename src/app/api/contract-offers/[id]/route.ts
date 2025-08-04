import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { id: contractOfferId } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Signing token is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch contract offer details using the comprehensive view
    const { data: contractOfferDetails, error } = await supabase
      .from('contract_offer_details')
      .select('*')
      .eq('id', contractOfferId)
      .eq('signing_token', token)
      .single();

    if (error || !contractOfferDetails) {
      console.error('Error fetching contract offer:', error);
      return NextResponse.json(
        { error: 'Contract offer not found or invalid token' },
        { status: 404 },
      );
    }

    // Check if contract offer has expired
    const now = new Date();
    const expiresAt = new Date(contractOfferDetails.expires_at);

    if (now > expiresAt) {
      return NextResponse.json({ error: 'Contract offer has expired' }, { status: 410 });
    }

    // Auto-fill contract placeholders with actual data
    const autoFillPlaceholders = (contractBody: string, data: any): string => {
      if (!contractBody) return contractBody;

      // Check if contract has been signed and has signature data
      const signatureData = data.additional_terms?.signature;
      let signatureHtml = '';

      if (signatureData && data.status === 'signed') {
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
      } else {
        // Contract not signed yet - show placeholder for signature area
        signatureHtml = `
          <div style="margin: 20px 0; padding: 15px; border: 2px dashed #ccc; border-radius: 5px; background-color: #fafafa; text-align: center;">
            <p style="margin: 0; color: #666; font-style: italic;">Signature will appear here once the contract is signed</p>
          </div>
        `;
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
          ? `${Number(data.salary_amount).toLocaleString()}`
          : '',
        '{{ salary_currency }}': data.salary_currency || '',
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

    // Transform the data to match the frontend interface
    // The view provides all data in a flattened structure
    const transformedOffer = {
      id: contractOfferDetails.id,
      status: contractOfferDetails.status,
      salaryAmount: contractOfferDetails.salary_amount,
      salaryCurrency: contractOfferDetails.salary_currency,
      startDate: contractOfferDetails.start_date,
      endDate: contractOfferDetails.end_date,
      expiresAt: contractOfferDetails.expires_at,
      sentAt: contractOfferDetails.sent_at,
      signedAt: contractOfferDetails.signed_at,
      rejectedAt: contractOfferDetails.rejected_at,
      signedCopyUrl: contractOfferDetails.signed_copy_url,
      additionalTerms: contractOfferDetails.additional_terms,
      contract: {
        id: contractOfferDetails.contract_id,
        title: contractOfferDetails.contract_title,
        body: autoFillPlaceholders(contractOfferDetails.contract_body, contractOfferDetails),
        jobTitle: { name: contractOfferDetails.job_title_name || 'Position' },
        employmentType: { name: contractOfferDetails.employment_type_name || 'Full-time' },
      },
      candidate: {
        id: contractOfferDetails.candidate_id,
        firstName: contractOfferDetails.candidate_first_name,
        lastName: contractOfferDetails.candidate_last_name,
        email: contractOfferDetails.candidate_email,
      },
      sentByProfile: {
        firstName: contractOfferDetails.sender_first_name,
        lastName: contractOfferDetails.sender_last_name,
        email: contractOfferDetails.sender_email,
      },
      companyName: contractOfferDetails.company_name || 'Company',
    };

    return NextResponse.json({
      contractOffer: transformedOffer,
    });
  } catch (error) {
    console.error('Error in contract offer GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
