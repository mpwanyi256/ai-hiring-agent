import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url);
    const { id } = await params;

    const supabase = await createClient();

    // Check authentication
    // const {
    //   data: { session },
    //   error: authError,
    // } = await supabase.auth.getSession();

    // if (authError || !session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch contract offer details using the view
    const { data: contractOfferDetails, error } = await supabase
      .from('contract_offer_details')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contract offer:', error);
      return NextResponse.json({ error: 'Contract offer not found' }, { status: 404 });
    }

    // Get dynamic placeholders from the database
    const getDynamicPlaceholders = async () => {
      const { data: placeholders, error: placeholdersError } = await supabase
        .from('contract_placeholders')
        .select('key, label')
        .eq('is_active', true);

      if (placeholdersError) {
        console.error('Error fetching placeholders:', placeholdersError);
        return [];
      }

      return placeholders || [];
    };

    // Auto-fill contract placeholders with actual data
    const autoFillPlaceholders = async (contractBody: string, data: any): Promise<string> => {
      if (!contractBody) return contractBody;

      // Generate signature HTML based on contract status
      let signatureHtml = '';
      if (data.status === 'signed' && data.signed_copy_url) {
        // Contract is signed - show signature confirmation
        const signedDate = data.signed_at
          ? new Date(data.signed_at).toLocaleDateString()
          : 'Unknown date';
        signatureHtml = `
          <div style="margin: 20px 0; padding: 15px; border: 2px solid #10b981; border-radius: 5px; background-color: #f0fdf4;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="color: #10b981; font-weight: bold; margin-right: 8px;">✓</span>
              <strong style="color: #065f46;">Contract Signed</strong>
            </div>
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              This contract was digitally signed on ${signedDate}
            </p>
          </div>
        `;
      } else {
        // Contract not signed yet - show placeholder for signature area
        signatureHtml = `
          <div style="margin: 20px 0; padding: 15px; border: 2px dashed #ccc; border-radius: 5px; background-color: #fafafa; text-align: center;">
            <p style="margin: 0; color: #666; font-style: italic;">Signature will appear here once the contract is signed</p>
          </div>
        `;
      }

      // Get available placeholders from database
      const availablePlaceholders = await getDynamicPlaceholders();

      // Create a mapping of placeholder keys to their values
      const placeholderValues: Record<string, string> = {
        candidate_name:
          `${data.candidate_first_name || ''} ${data.candidate_last_name || ''}`.trim(),
        candidate_first_name: data.candidate_first_name || '',
        candidate_last_name: data.candidate_last_name || '',
        candidate_email: data.candidate_email || '',
        job_title: data.job_title_name || 'Position',
        employment_type: data.employment_type_name || 'Full-time',
        company_name: data.company_name || 'Company',
        company_address: data.company_address || '',
        salary_amount: data.salary_amount ? `${Number(data.salary_amount).toLocaleString()}` : '',
        salary_currency: data.salary_currency || '',
        start_date: data.start_date ? new Date(data.start_date).toLocaleDateString() : 'TBD',
        end_date: data.end_date ? new Date(data.end_date).toLocaleDateString() : 'Indefinite',
        signing_date: new Date().toLocaleDateString(),
        sender_name: `${data.sender_first_name || ''} ${data.sender_last_name || ''}`.trim(),
        sender_email: data.sender_email || '',
        candidate_signature: signatureHtml,
        contract_duration: data.contract_duration || '',
        probation_period: data.probation_period || '',
        notice_period: data.notice_period || '',
        benefits_summary: data.benefits_summary || '',
        reporting_manager: data.reporting_manager || '',
        department: data.department || '',
        work_location: data.work_location || '',
        working_hours: data.working_hours || '',
      };

      let filledBody = contractBody;

      // Replace placeholders with actual values
      // First, replace placeholders that exist in our database
      availablePlaceholders.forEach((placeholder) => {
        const placeholderText = `{{ ${placeholder.key} }}`;
        const value = placeholderValues[placeholder.key] || '';
        const regex = new RegExp(placeholderText.replace(/[{}]/g, '\\$&'), 'gi');
        filledBody = filledBody.replace(regex, value);
      });

      // Also handle any remaining placeholders that might not be in the database yet
      Object.entries(placeholderValues).forEach(([key, value]) => {
        const placeholderText = `{{ ${key} }}`;
        const regex = new RegExp(placeholderText.replace(/[{}]/g, '\\$&'), 'gi');
        filledBody = filledBody.replace(regex, value);
      });

      return filledBody;
    };

    // Transform the data to match the frontend interface
    const transformedOffer = {
      id: contractOfferDetails.id,
      contractId: contractOfferDetails.contract_id,
      candidateId: contractOfferDetails.candidate_id,
      status: contractOfferDetails.status,
      signedCopyUrl: contractOfferDetails.signed_copy_url,
      sentBy: contractOfferDetails.sent_by,
      sentAt: contractOfferDetails.sent_at,
      signedAt: contractOfferDetails.signed_at,
      rejectedAt: contractOfferDetails.rejected_at,
      rejectionReason: contractOfferDetails.rejection_reason,
      signingToken: contractOfferDetails.signing_token,
      expiresAt: contractOfferDetails.expires_at,
      salaryAmount: contractOfferDetails.salary_amount,
      salaryCurrency: contractOfferDetails.salary_currency,
      startDate: contractOfferDetails.start_date,
      endDate: contractOfferDetails.end_date,
      additionalTerms: contractOfferDetails.additional_terms,
      createdAt: contractOfferDetails.created_at,
      updatedAt: contractOfferDetails.updated_at,

      // Contract details
      contractTitle: contractOfferDetails.contract_title,
      contractContent: await autoFillPlaceholders(
        contractOfferDetails.contract_content,
        contractOfferDetails,
      ),

      // Candidate details
      candidateFirstName: contractOfferDetails.candidate_first_name,
      candidateLastName: contractOfferDetails.candidate_last_name,
      candidateEmail: contractOfferDetails.candidate_email,

      // Company details
      companyName: contractOfferDetails.company_name,

      // Job details
      jobTitleName: contractOfferDetails.job_title_name,
      employmentTypeName: contractOfferDetails.employment_type_name,

      // Sender details
      senderFirstName: contractOfferDetails.sender_first_name,
      senderLastName: contractOfferDetails.sender_last_name,
      senderEmail: contractOfferDetails.sender_email,
    };

    return NextResponse.json(transformedOffer);
  } catch (error) {
    console.error('Error in contract offer API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
