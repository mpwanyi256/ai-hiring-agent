import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: contractOfferId } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's company to ensure they have access to this contract
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Get contract offer details
    const { data: contractOffer, error: fetchError } = await supabase
      .from('contract_offers')
      .select('*')
      .eq('id', contractOfferId)
      .single();

    if (fetchError || !contractOffer) {
      console.error('Error fetching contract offer for PDF view:', fetchError);
      return NextResponse.json({ error: 'Contract offer not found' }, { status: 404 });
    }

    // Check if contract has been signed and has a signed copy URL
    if (contractOffer.status !== 'signed') {
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
      console.error('Error downloading signed contract for view:', downloadError);
      return NextResponse.json({ error: 'Failed to load signed contract' }, { status: 500 });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Return the PDF file for inline viewing (not as download)
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.byteLength.toString(),
        // Use inline disposition for viewing in browser/iframe
        'Content-Disposition': 'inline',
        // Add cache headers for better performance
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in signed contract view API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
