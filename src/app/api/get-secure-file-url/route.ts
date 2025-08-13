import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GetSecureFileUrlParams } from '@/types/buckets';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<GetSecureFileUrlParams> },
) {
  const { bucketName, filePath, validity } = await params;

  if (!bucketName || !filePath) {
    return NextResponse.json({ error: 'Bucket name and file path are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const defaultValidDuration = 60 * 60 * 24;
  const validFor = validity * defaultValidDuration;

  // Get signedUrl valid for 1 day
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, validFor);

  if (error) {
    return NextResponse.json({ error: 'Failed to get secure file URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
