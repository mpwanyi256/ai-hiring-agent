import { createAsyncThunk } from '@reduxjs/toolkit';
import { JobPermissionLevel } from '@/types/jobPermissions';

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

// Grant job permission to a user by user_id
export const grantJobPermissionById = createAsyncThunk(
  'jobPermissions/grantJobPermissionById',
  async (
    params: { job_id: string; user_id: string; permission_level: JobPermissionLevel },
    { dispatch },
  ) => {
    const response = await fetch(`/api/jobs/${params.job_id}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: params.user_id,
        permission_level: params.permission_level,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to grant job permission');
    }

    const data = await response.json();

    // fetch job permissions
    dispatch(fetchJobPermissions(params.job_id));

    return data.permission;
  },
);

// Grant job permission to a user by email
export const grantJobPermission = createAsyncThunk(
  'jobPermissions/grantJobPermission',
  async (
    params: { job_id: string; user_email: string; permission_level: JobPermissionLevel },
    { dispatch },
  ) => {
    const response = await fetch(`/api/jobs/${params.job_id}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: params.user_email,
        permission_level: params.permission_level,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to grant job permission');
    }

    // fetch job permissions
    dispatch(fetchJobPermissions(params.job_id));

    const data = await response.json();
    return data.permission;
  },
);

// Remove job permission from a user
export const removeJobPermission = createAsyncThunk(
  'jobPermissions/removeJobPermission',
  async (params: { job_id: string; user_id: string }, { dispatch }) => {
    const response = await fetch(
      `/api/jobs/${params.job_id}/permissions?user_id=${params.user_id}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove job permission');
    }

    // fetch job permissions
    dispatch(fetchJobPermissions(params.job_id));

    return { job_id: params.job_id, user_id: params.user_id };
  },
);

// Update job permission level
export const updateJobPermission = createAsyncThunk(
  'jobPermissions/updateJobPermission',
  async (
    params: { job_id: string; user_id: string; permission_level: JobPermissionLevel },
    { dispatch },
  ) => {
    const response = await fetch(`/api/jobs/${params.job_id}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: params.user_id,
        permission_level: params.permission_level,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update job permission');
    }

    const data = await response.json();

    // fetch job permissions
    dispatch(fetchJobPermissions(params.job_id));

    return data.permission;
  },
);
