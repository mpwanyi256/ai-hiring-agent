import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  JobPermissionDetailed,
  GrantJobPermissionPayload,
  UpdateJobPermissionPayload,
} from '@/types/jobPermissions';

// Fetch job permissions for a specific job
export const fetchJobPermissions = createAsyncThunk(
  'jobPermissions/fetchJobPermissions',
  async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}/permissions`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch job permissions');
    }

    const data = await response.json();
    return { jobId, permissions: data.permissions };
  },
);

// Grant job permission to a user
export const grantJobPermission = createAsyncThunk(
  'jobPermissions/grantJobPermission',
  async (payload: GrantJobPermissionPayload) => {
    const response = await fetch(`/api/jobs/${payload.job_id}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: payload.user_id,
        permission_level: payload.permission_level,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to grant job permission');
    }

    const data = await response.json();
    return data.permission;
  },
);

// Update job permission level
export const updateJobPermission = createAsyncThunk(
  'jobPermissions/updateJobPermission',
  async (payload: UpdateJobPermissionPayload) => {
    const response = await fetch(`/api/jobs/permissions/${payload.permission_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permission_level: payload.permission_level,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update job permission');
    }

    const data = await response.json();
    return data.permission;
  },
);

// Revoke job permission
export const revokeJobPermission = createAsyncThunk(
  'jobPermissions/revokeJobPermission',
  async (permissionId: string) => {
    const response = await fetch(`/api/jobs/permissions/${permissionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to revoke job permission');
    }

    return { permissionId };
  },
);
