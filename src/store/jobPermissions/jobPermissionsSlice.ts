import { createSlice } from '@reduxjs/toolkit';
import { JobPermission } from '@/types/jobPermissions';
import {
  fetchJobPermissions,
  grantJobPermission,
  removeJobPermission,
  updateJobPermission,
} from './jobPermissionsThunks';

interface JobPermissionsState {
  permissions: JobPermission[];
  loading: boolean;
  error: string | null;
}

const initialState: JobPermissionsState = {
  permissions: [],
  loading: false,
  error: null,
};

const jobPermissionsSlice = createSlice({
  name: 'jobPermissions',
  initialState,
  reducers: {
    clearPermissions: (state) => {
      state.permissions = [];
      state.error = null;
    },
    clearError: (state) => {
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

    // Remove job permission
    builder.addCase(removeJobPermission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeJobPermission.fulfilled, (state, action) => {
      state.loading = false;
      state.permissions = state.permissions.filter(
        (p) => !(p.user_id === action.payload.user_id && p.job_id === action.payload.job_id),
      );
    });
    builder.addCase(removeJobPermission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to remove job permission';
    });

    // Update job permission
    builder.addCase(updateJobPermission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateJobPermission.fulfilled, (state, action) => {
      state.loading = false;
      const existingIndex = state.permissions.findIndex(
        (p) => p.user_id === action.payload.user_id && p.job_id === action.payload.job_id,
      );
      if (existingIndex >= 0) {
        state.permissions[existingIndex] = action.payload;
      }
    });
    builder.addCase(updateJobPermission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update job permission';
    });
  },
});

export const { clearPermissions, clearError } = jobPermissionsSlice.actions;
export default jobPermissionsSlice.reducer;
