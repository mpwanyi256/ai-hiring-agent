import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { EmailService, emailHelpers } from '@/lib/email/emailService';
import { JobPermissionLevel } from '@/types/jobPermissions';

export async function POST(request: NextRequest) {
  try {
    const { permissionId } = await request.json();

    if (!permissionId) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get permission details with related data
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions_detailed')
      .select('*')
      .eq('id', permissionId)
      .single();

    if (permissionError || !permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Get granter details
    const { data: granter, error: granterError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', permission.granted_by)
      .single();

    if (granterError || !granter) {
      return NextResponse.json({ error: 'Granter not found' }, { status: 404 });
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', permission.company_id)
      .single();

    if (companyError) {
      console.warn('Company not found, using fallback name');
    }

    // Prepare email data
    const emailData = {
      recipientName: emailHelpers.formatUserName(permission.first_name, permission.last_name),
      granterName: emailHelpers.formatUserName(granter.first_name, granter.last_name),
      jobTitle: permission.job_title,
      permissionLevel: permission.permission_level as JobPermissionLevel,
      companyName: emailHelpers.getCompanyName(company?.name),
      jobUrl: emailHelpers.getJobUrl(permission.job_id),
    };

    // Send email notification
    const result = await EmailService.sendJobPermissionGranted(permission.email, emailData);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send notification email', details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Job permission notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending job permission notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
