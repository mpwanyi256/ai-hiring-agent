import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('job_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/json',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'File type not supported. Please use images, PDFs, Word docs, or text files.',
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get current user for permission check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions (same as messages API)
    const { data: permission } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: job } = await supabase.from('jobs').select('profile_id').eq('id', jobId).single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isJobOwner = job && job.profile_id === user.id;
    const isAdmin = profile && profile.role === 'admin';

    if (!permission && !isJobOwner && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Generate unique filename using job ID and timestamp
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${jobId}/${timestamp}_${cleanFileName}`;

    // Convert File to Buffer for upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Use service role client to bypass RLS for storage operations
    const supabaseAdmin = createServiceRoleClient();

    // Upload to Supabase Storage using service role
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('message-attachments')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload file: ' + uploadError.message,
        },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('message-attachments')
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
