import { NextRequest, NextResponse } from 'next/server';
import { uploadService } from '@/lib/services/uploadService';
import { AppRequestParams } from '@/types/api';

export async function POST(request: NextRequest, { params }: AppRequestParams<{ id: string }>) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `logos/${id}_${Date.now()}.${ext}`;

    const { public_url, path } = await uploadService.uploadFile({
      file,
      bucketName: 'company',
      path: fileName,
    });
    return NextResponse.json({ url: public_url, path });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logo_path = searchParams.get('logo_path');
    console.log('deleting logo', logo_path);
    if (!logo_path) return NextResponse.json({ error: 'Logo path is required' }, { status: 400 });
    await uploadService.deleteFile({ bucketName: 'company', path: logo_path });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('error in DELETE request', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  }
}
