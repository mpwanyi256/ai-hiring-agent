import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
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
