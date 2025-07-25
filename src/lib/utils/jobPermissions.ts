import { JobPermissionLevel } from '@/types/jobPermissions';

/**
 * Check if a user has permission to access a specific job
 * @param supabase - Supabase client instance
 * @param userId - User ID to check permissions for
 * @param jobId - Job ID to check access to
 * @param requiredLevel - Minimum permission level required (optional)
 * @returns Promise<boolean> - Whether user has access
 */
export async function checkJobPermission(
  supabase: any,
  userId: string,
  jobId: string,
  requiredLevel?: JobPermissionLevel,
): Promise<boolean> {
  try {
    console.log('Checking job permission for user', userId, 'and job', jobId);
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return false;
    }

    console.log('found user profile', profile);

    // Get job details with company info through profiles
    const { data: jobWithCompany, error: jobError } = await supabase
      .from('jobs')
      .select(
        `
        id,
        profile_id,
        profiles!inner(company_id)
      `,
      )
      .eq('id', jobId)
      .single();

    if (jobError || !jobWithCompany) {
      return false;
    }
    console.log('Found Job', jobWithCompany);

    // Check if user and job are in the same company
    if (jobWithCompany.profiles.company_id !== profile.company_id) {
      console.log(
        'User does not have permission to access this job since they are not in the same company',
      );
      return false;
    }

    // Admin users have access to all jobs in their company
    if (profile.role === 'admin') {
      console.log('User has admin permission to access this job');
      return true;
    }

    // Check if user has explicit job permission (this now includes job creators)
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .maybeSingle();

    if (permissionError) {
      console.log('Error checking job permission', permissionError);
      return false;
    }

    if (!permission) {
      console.log(
        'User does not have permission to access this job since they are not in the job permissions table',
      );
      return false;
    }

    // If a required level is specified, check if user's permission meets the requirement
    if (requiredLevel) {
      console.log(
        'Checking if user has required permission level',
        permission.permission_level,
        requiredLevel,
      );
      return hasRequiredPermissionLevel(permission.permission_level, requiredLevel);
    }

    return true;
  } catch (error) {
    console.error('Error checking job permission:', error);
    return false;
  }
}

/**
 * Check if user's permission level meets the required level
 * @param userLevel - User's current permission level
 * @param requiredLevel - Required permission level
 * @returns boolean - Whether user meets the requirement
 */
export function hasRequiredPermissionLevel(
  userLevel: JobPermissionLevel,
  requiredLevel: JobPermissionLevel,
): boolean {
  const levelHierarchy = {
    [JobPermissionLevel.VIEWER]: 1,
    [JobPermissionLevel.INTERVIEWER]: 2,
    [JobPermissionLevel.MANAGER]: 3,
    [JobPermissionLevel.ADMIN]: 4,
  };

  return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
}

/**
 * Get user's permission level for a specific job
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - Job ID
 * @returns Promise<JobPermissionLevel | null> - User's permission level or null if no access
 */
export async function getUserJobPermissionLevel(
  supabase: any,
  userId: string,
  jobId: string,
): Promise<JobPermissionLevel | null> {
  try {
    // Check job permission (job creators are now automatically in permissions table)
    const { data: permission, error: permissionError } = await supabase
      .from('job_permissions')
      .select('permission_level')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .maybeSingle();

    if (permissionError || !permission) {
      return null;
    }

    return permission.permission_level as JobPermissionLevel;
  } catch (error) {
    console.error('Error getting user job permission level:', error);
    return null;
  }
}

/**
 * Middleware function to check job permissions in API routes
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param jobId - Job ID
 * @param requiredLevel - Required permission level (optional)
 * @returns Promise<{ hasAccess: boolean; error?: string }> - Access result
 */
export async function validateJobAccess(
  supabase: any,
  userId: string,
  jobId: string,
  requiredLevel?: JobPermissionLevel,
): Promise<{ hasAccess: boolean; error?: string }> {
  try {
    const hasPermission = await checkJobPermission(supabase, userId, jobId, requiredLevel);

    if (!hasPermission) {
      const errorMessage = requiredLevel
        ? `You need ${requiredLevel} level access or higher to perform this action`
        : 'You do not have permission to access this job';

      return { hasAccess: false, error: errorMessage };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error('Error validating job access:', error);
    return { hasAccess: false, error: 'Failed to validate job access' };
  }
}
