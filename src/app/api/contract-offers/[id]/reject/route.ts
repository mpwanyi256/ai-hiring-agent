import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendContractRejectedEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { signingToken: token, rejectionReason } = body;

    if (!token) {
      return NextResponse.json({ error: 'Signing token is required' }, { status: 400 });
    }

    // Fetch contract offer with all related data using the view
    const { data: contractOffer, error: fetchError } = await supabase
      .from('contract_offer_details')
      .select('*')
      .eq('id', offerId)
      .eq('signing_token', token)
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

    // Update contract offer status to rejected
    const updateData = {
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: rejectionReason || null,
    };

    const { data: updatedOffer, error: updateError } = await supabase
      .from('contract_offers')
      .update(updateData)
      .eq('id', offerId)
      .eq('signing_token', token)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract offer:', {
        error: updateError,
        offerId,
        token,
        updateData,
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
      });
      return NextResponse.json(
        {
          error: 'Failed to update contract status',
          details: updateError.message || 'Unknown database error',
        },
        { status: 500 },
      );
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

      // Send rejection notification to company
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
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Continue - the contract status was updated successfully
    }

    return NextResponse.json({
      success: true,
      contractOffer: updatedOffer,
      action: 'reject',
      message: 'Contract offer has been rejected successfully',
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contract/${offerId}/declined`,
    });
  } catch (error) {
    console.error('Error in contract rejection API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET method to retrieve contract offer details for rejection (same as sign endpoint)
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
      action: 'reject',
    });
  } catch (error) {
    console.error('Error fetching contract offer for rejection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
