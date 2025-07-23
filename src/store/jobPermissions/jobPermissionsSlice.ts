import { createSlice } from '@reduxjs/toolkit';
import { JobPermissionsState } from '@/types/jobPermissions';
import {
  fetchJobPermissions,
  grantJobPermission,
  updateJobPermission,
  revokeJobPermission,
} from './jobPermissionsThunks';

const initialState: JobPermissionsState = {
  permissions: [],
  loading: false,
  error: null,
};

const jobPermissionsSlice = createSlice({
  name: 'jobPermissions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetPermissions: (state) => {
      state.permissions = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch job permissions
    builder.addCase(fetchJobPermissions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchJobPermissions.fulfilled, (state, action) => {
      state.loading = false;
      state.permissions = action.payload.permissions;
    });
    builder.addCase(fetchJobPermissions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch job permissions';
    });

    // Grant job permission
    builder.addCase(grantJobPermission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(grantJobPermission.fulfilled, (state, action) => {
      state.loading = false;
      // Check if permission already exists (update) or add new
      const existingIndex = state.permissions.findIndex(
        (p) => p.user_id === action.payload.user_id && p.job_id === action.payload.job_id,
      );

      if (existingIndex >= 0) {
        state.permissions[existingIndex] = action.payload;
      } else {
        state.permissions.push(action.payload);
      }
    });
    builder.addCase(grantJobPermission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to grant job permission';
    });

    // Update job permission
    builder.addCase(updateJobPermission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateJobPermission.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.permissions.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.permissions[index] = action.payload;
      }
    });
    builder.addCase(updateJobPermission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update job permission';
    });

    // Revoke job permission
    builder.addCase(revokeJobPermission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(revokeJobPermission.fulfilled, (state, action) => {
      state.loading = false;
      state.permissions = state.permissions.filter((p) => p.id !== action.payload.permissionId);
    });
    builder.addCase(revokeJobPermission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to revoke job permission';
    });
  },
});

export const { clearError, resetPermissions } = jobPermissionsSlice.actions;
export default jobPermissionsSlice.reducer;
