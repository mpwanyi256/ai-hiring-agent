import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractOfferId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch the contract offer with access validation
    const { data: contractOffer, error: offerError } = await supabase
      .from('contract_offers')
      .select(
        `
        id,
        status,
        signed_copy_url,
        contract:contracts(
          id, 
          title,
          company_id
        ),
        candidate:candidates(
          id,
          first_name,
          last_name,
          job:jobs!candidates_job_id_fkey(
            profile:profiles!jobs_profile_id_fkey(company_id)
          )
        )
      `,
      )
      .eq('id', contractOfferId)
      .single();

    if (offerError || !contractOffer) {
      return NextResponse.json({ error: 'Contract offer not found' }, { status: 404 });
    }

    // Verify access - user must be from the same company as the contract or the candidate
    const contractCompanyId = (contractOffer.contract as any)?.company_id;
    const candidateCompanyId = (contractOffer.candidate as any)?.job?.profile?.company_id;

    const hasAccess =
      profile.company_id === contractCompanyId || profile.company_id === candidateCompanyId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if contract is signed and has a PDF
    if (contractOffer.status !== 'signed') {
      return NextResponse.json(
        {
          error: 'Contract has not been signed yet',
        },
        { status: 400 },
      );
    }

    if (!contractOffer.signed_copy_url) {
      return NextResponse.json(
        {
          error: 'Signed contract PDF not available',
        },
        { status: 404 },
      );
    }

    // Extract the file path from the signed_copy_url
    // The URL might be a full public URL, so we need to extract just the file path
    let filePath = contractOffer.signed_copy_url;
    if (filePath.includes('/storage/v1/object/public/contracts/')) {
      filePath = filePath.split('/storage/v1/object/public/contracts/')[1];
    } else if (filePath.includes('contracts/')) {
      filePath = filePath.split('contracts/')[1];
    }

    // Get the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('contracts')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading PDF:', downloadError);
      return NextResponse.json(
        {
          error: 'Failed to download contract PDF',
        },
        { status: 500 },
      );
    }

    // Convert blob to buffer
    const buffer = await fileData.arrayBuffer();

    // Generate download filename
    const candidateFirstName = (contractOffer.candidate as any)?.first_name || '';
    const candidateLastName = (contractOffer.candidate as any)?.last_name || '';
    const candidateName = `${candidateFirstName} ${candidateLastName}`.trim();
    const contractTitle = (contractOffer.contract as any)?.title || 'Contract';
    const downloadFilename = `contract-${candidateName.replace(/\s+/g, '-')}-${contractTitle.replace(/\s+/g, '-')}.pdf`;

    // Return the PDF file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in contract download API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
