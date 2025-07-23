import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { job_id: string } }) {
  try {
    const { job_id } = await params;

    if (!job_id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
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

    // Check if user has permission to view job permissions
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('profile_id')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user is job owner or has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canViewPermissions = job.profile_id === user.id || profile.role === 'admin';

    if (!canViewPermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch job permissions with detailed information
    const { data: permissions, error: permissionsError } = await supabase
      .from('job_permissions_detailed')
      .select('*')
      .eq('job_id', job_id)
      .order('granted_at', { ascending: false });

    if (permissionsError) {
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching job permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { job_id: string } }) {
  try {
    const { job_id } = await params;
    const { user_id, permission_level } = await request.json();

    if (!job_id || !user_id || !permission_level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validPermissionLevels = ['viewer', 'interviewer', 'manager', 'admin'];
    if (!validPermissionLevels.includes(permission_level)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 });
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

    // Check if user has permission to grant permissions
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('profile_id')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user is job owner or has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canGrantPermissions = job.profile_id === user.id || profile.role === 'admin';

    if (!canGrantPermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify the user being granted permissions is in the same company
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.company_id !== profile.company_id) {
      return NextResponse.json(
        { error: 'Can only grant permissions to users in the same company' },
        { status: 403 },
      );
    }

    // Insert or update job permission
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .upsert(
        {
          job_id,
          user_id,
          permission_level,
          granted_by: user.id,
        },
        {
          onConflict: 'job_id,user_id',
        },
      )
      .select()
      .single();

    if (permissionError) {
      return NextResponse.json({ error: 'Failed to grant permission' }, { status: 500 });
    }

    // Fetch the detailed permission info
    const { data: detailedPermission, error: detailedError } = await supabase
      .from('job_permissions_detailed')
      .select('*')
      .eq('id', permission.id)
      .single();

    if (detailedError) {
      return NextResponse.json({ error: 'Failed to fetch updated permission' }, { status: 500 });
    }

    return NextResponse.json({ permission: detailedPermission });
  } catch (error) {
    console.error('Error granting job permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
