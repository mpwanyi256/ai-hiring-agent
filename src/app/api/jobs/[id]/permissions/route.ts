import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user with retry logic for better reliability
    let user;
    let userError;

    for (let i = 0; i < 3; i++) {
      const userResult = await supabase.auth.getUser();
      user = userResult.data.user;
      userError = userResult.error;

      if (user && !userError) break;

      // Wait a bit before retrying
      if (i < 2) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (userError || !user) {
      console.error('Auth error after retries:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view job permissions
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('profile_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user is job owner or has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canViewPermissions = job.profile_id === user.id || profile.role === 'admin';

    if (!canViewPermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch job permissions with detailed information using JOIN
    const { data: permissions, error: permissionsError } = await supabase
      .from('job_permissions')
      .select(
        `
        id,
        job_id,
        user_id,
        permission_level,
        granted_by,
        granted_at,
        created_at,
        updated_at,
        profiles!job_permissions_user_id_fkey(
          first_name,
          last_name,
          email,
          role
        ),
        jobs!job_permissions_job_id_fkey(
          title,
          profile_id
        ),
        granted_by_profile:profiles!job_permissions_granted_by_fkey(
          first_name,
          last_name
        )
      `,
      )
      .eq('job_id', jobId)
      .order('granted_at', { ascending: false });

    if (permissionsError) {
      console.error('Permissions error:', permissionsError);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedPermissions = (permissions || []).map((perm: any) => ({
      id: perm.id,
      job_id: perm.job_id,
      user_id: perm.user_id,
      permission_level: perm.permission_level,
      granted_by: perm.granted_by,
      granted_at: perm.granted_at,
      created_at: perm.created_at,
      updated_at: perm.updated_at,
      user_first_name: perm.profiles?.first_name || null,
      user_last_name: perm.profiles?.last_name || null,
      user_email: perm.profiles?.email || null,
      user_role: perm.profiles?.role || null,
      job_title: perm.jobs?.title || null,
      job_owner_id: perm.jobs?.profile_id || null,
      granted_by_first_name: perm.granted_by_profile?.first_name || null,
      granted_by_last_name: perm.granted_by_profile?.last_name || null,
    }));

    return NextResponse.json({ permissions: transformedPermissions });
  } catch (error) {
    console.error('Error fetching job permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { user_id, user_email, permission_level } = body;

    if (!jobId || !permission_level || (!user_id && !user_email)) {
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
      .eq('id', jobId)
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

    let targetUserId = user_id;

    // If user_email is provided, find the user by email
    if (user_email && !user_id) {
      const { data: targetUser, error: targetUserError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('email', user_email)
        .single();

      if (targetUserError || !targetUser) {
        return NextResponse.json(
          { error: 'User not found with the provided email' },
          { status: 404 },
        );
      }

      if (targetUser.company_id !== profile.company_id) {
        return NextResponse.json(
          { error: 'Can only grant permissions to users in the same company' },
          { status: 403 },
        );
      }

      targetUserId = targetUser.id;
    } else if (user_id) {
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
    }

    // Insert or update job permission
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .upsert(
        {
          job_id: jobId,
          user_id: targetUserId,
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

    // Fetch the updated permission with JOIN to get user details
    const { data: updatedPermission, error: fetchError } = await supabase
      .from('job_permissions')
      .select(
        `
        id,
        job_id,
        user_id,
        permission_level,
        granted_by,
        granted_at,
        created_at,
        updated_at,
        profiles!job_permissions_user_id_fkey(
          first_name,
          last_name,
          email,
          role
        )
      `,
      )
      .eq('id', permission.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch updated permission' }, { status: 500 });
    }

    // Transform the data to match expected format
    const profile_data = updatedPermission.profiles as any;
    const transformedPermission = {
      id: updatedPermission.id,
      job_id: updatedPermission.job_id,
      user_id: updatedPermission.user_id,
      permission_level: updatedPermission.permission_level,
      granted_by: updatedPermission.granted_by,
      granted_at: updatedPermission.granted_at,
      created_at: updatedPermission.created_at,
      updated_at: updatedPermission.updated_at,
      user_first_name: profile_data?.first_name || null,
      user_last_name: profile_data?.last_name || null,
      user_email: profile_data?.email || null,
      user_role: profile_data?.role || null,
    };

    return NextResponse.json({ permission: transformedPermission });
  } catch (error) {
    console.error('Error granting job permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!jobId || !userId) {
      return NextResponse.json({ error: 'Job ID and User ID are required' }, { status: 400 });
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

    // Check if user has permission to remove permissions
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('profile_id')
      .eq('id', jobId)
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

    const canRemovePermissions = job.profile_id === user.id || profile.role === 'admin';

    if (!canRemovePermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Don't allow removing permissions for the job owner
    if (userId === job.profile_id) {
      return NextResponse.json(
        { error: 'Cannot remove permissions for job owner' },
        { status: 400 },
      );
    }

    // Remove the permission
    const { error: deleteError } = await supabase
      .from('job_permissions')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to remove permission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Error removing job permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
