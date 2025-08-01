import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractOfferEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractOfferId } = await params;
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

    // Fetch the contract offer with all related data
    const { data: contractOffer, error: fetchError } = await supabase
      .from('contract_offers')
      .select(
        `
        id,
        status,
        salary_amount,
        salary_currency,
        start_date,
        expires_at,
        signing_token,
        contract:contracts (
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
        ),
        candidate:candidates (
          id,
          first_name,
          last_name,
          email,
          job_title
        )
      `,
      )
      .eq('id', contractOfferId)
      .single();

    if (fetchError || !contractOffer) {
      return NextResponse.json({ error: 'Contract offer not found' }, { status: 404 });
    }

    // Verify the contract belongs to the user's company
    if ((contractOffer.contract as any).company_id !== profile.company_id) {
      return NextResponse.json({ error: 'Unauthorized to resend this contract' }, { status: 403 });
    }

    // Only allow resending if status is 'sent' and not expired
    if (contractOffer.status !== 'sent') {
      return NextResponse.json({ error: 'Can only resend pending contracts' }, { status: 400 });
    }

    // Check if contract has expired - if so, extend the expiration
    const now = new Date();
    const currentExpiry = new Date(contractOffer.expires_at);
    let newExpiry = currentExpiry;

    if (now > currentExpiry) {
      // Extend expiry by 30 days from now
      newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Update the expiration date in the database
      const { error: updateError } = await supabase
        .from('contract_offers')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', contractOfferId);

      if (updateError) {
        console.error('Error updating contract expiry:', updateError);
        return NextResponse.json({ error: 'Failed to extend contract expiry' }, { status: 500 });
      }
    }

    // Generate the signing link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signingLink = `${baseUrl}/contract/${contractOfferId}/sign?token=${contractOffer.signing_token}`;

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single();

    const companyName = company?.name || profile.companyName || 'Company';

    // Send the email
    try {
      const emailResult = await sendContractOfferEmail({
        to: (contractOffer.candidate as any).email,
        candidateName:
          `${(contractOffer.candidate as any).first_name || ''} ${(contractOffer.candidate as any).last_name || ''}`.trim(),
        companyName,
        jobTitle: (contractOffer.candidate as any).job_title || 'Position',
        employmentType: (contractOffer.contract as any).employment_type?.name || 'Full-time',
        startDate: contractOffer.start_date
          ? new Date(contractOffer.start_date).toLocaleDateString()
          : 'To be determined',
        salaryAmount: contractOffer.salary_amount,
        salaryCurrency: contractOffer.salary_currency,
        expiresAt: newExpiry.toISOString(),
        signingLink,
        contactEmail: profile.email,
        cc: [profile.email], // CC the sender
      });

      if (!emailResult.success) {
        console.error('Failed to resend contract offer email:', emailResult.error);
        return NextResponse.json({ error: 'Failed to send email notification' }, { status: 500 });
      }

      // Update the sent_at timestamp to track the resend
      const { error: updateSentError } = await supabase
        .from('contract_offers')
        .update({
          sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', contractOfferId);

      if (updateSentError) {
        console.error('Error updating sent timestamp:', updateSentError);
        // Don't fail the request since email was sent successfully
      }

      return NextResponse.json({
        success: true,
        message: 'Contract resent successfully',
        newExpiryDate: newExpiry.toISOString(),
      });
    } catch (emailError) {
      console.error('Error sending contract email:', emailError);
      return NextResponse.json({ error: 'Failed to send contract email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in contract resend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
