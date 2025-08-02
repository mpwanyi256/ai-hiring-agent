import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractOfferId } = await params;
    const { searchParams } = new URL(request.url);
    const signingToken = searchParams.get('token');

    if (!signingToken) {
      return NextResponse.json({ error: 'Signing token is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get contract offer details using the view
    const { data: contractOffer, error: fetchError } = await supabase
      .from('contract_offer_details')
      .select('*')
      .eq('id', contractOfferId)
      .eq('signing_token', signingToken)
      .single();

    if (fetchError || !contractOffer) {
      console.error('Error fetching contract offer:', fetchError);
      return NextResponse.json({ error: 'Contract offer not found' }, { status: 404 });
    }

    // Check if contract has been signed and has a signed copy URL
    if (contractOffer.status !== 'signed' || !contractOffer.signed_copy_url) {
      return NextResponse.json(
        { error: 'Contract has not been signed or signed copy is not available' },
        { status: 400 },
      );
    }

    // Extract the file path from the signed copy URL
    // URL format: https://domain.supabase.co/storage/v1/object/public/signed-contracts/path/to/file.pdf
    const urlParts = contractOffer.signed_copy_url.split('/');
    const bucketIndex = urlParts.findIndex((part: string) => part === 'signed-contracts');

    if (bucketIndex === -1) {
      return NextResponse.json({ error: 'Invalid signed copy URL' }, { status: 400 });
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('signed-contracts')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading signed contract:', downloadError);
      return NextResponse.json({ error: 'Failed to download signed contract' }, { status: 500 });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Generate download filename
    const candidateName =
      `${contractOffer.candidate_first_name} ${contractOffer.candidate_last_name}`.trim();
    const contractTitle = contractOffer.contract_title || 'Contract';
    const downloadFilename = `${contractTitle}-${candidateName.replace(/\s+/g, '-')}-Signed.pdf`;

    // Return the PDF file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in signed contract download API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
