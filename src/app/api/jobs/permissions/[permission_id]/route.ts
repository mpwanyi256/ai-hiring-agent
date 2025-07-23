import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { permission_id: string } },
) {
  try {
    const { permission_id } = await params;
    const { permission_level } = await request.json();

    if (!permission_id || !permission_level) {
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

    // Get permission details and check authorization
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select(
        `
        *,
        jobs:job_id (
          profile_id
        )
      `,
      )
      .eq('id', permission_id)
      .single();

    if (permissionError || !permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if user can modify this permission
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canModify =
      permission.jobs.profile_id === user.id || // Job owner
      profile.role === 'admin'; // Company admin

    if (!canModify) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update permission level
    const { data: updatedPermission, error: updateError } = await supabase
      .from('job_permissions')
      .update({ permission_level })
      .eq('id', permission_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }

    // Fetch detailed permission info
    const { data: detailedPermission, error: detailedError } = await supabase
      .from('job_permissions_detailed')
      .select('*')
      .eq('id', permission_id)
      .single();

    if (detailedError) {
      return NextResponse.json({ error: 'Failed to fetch updated permission' }, { status: 500 });
    }

    return NextResponse.json({ permission: detailedPermission });
  } catch (error) {
    console.error('Error updating job permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { permission_id: string } },
) {
  try {
    const { permission_id } = await params;

    if (!permission_id) {
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

    // Get permission details and check authorization
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select(
        `
        *,
        jobs:job_id (
          profile_id
        )
      `,
      )
      .eq('id', permission_id)
      .single();

    if (permissionError || !permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if user can revoke this permission
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canRevoke =
      permission.jobs.profile_id === user.id || // Job owner
      profile.role === 'admin'; // Company admin

    if (!canRevoke) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Prevent job owner from revoking their own admin permission
    if (permission.user_id === user.id && permission.permission_level === 'admin') {
      return NextResponse.json(
        { error: 'Cannot revoke your own admin permission' },
        { status: 400 },
      );
    }

    // Delete permission
    const { error: deleteError } = await supabase
      .from('job_permissions')
      .delete()
      .eq('id', permission_id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to revoke permission' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Permission revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking job permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
