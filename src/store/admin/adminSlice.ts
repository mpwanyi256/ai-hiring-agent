import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminState } from '@/types/admin';
import {
  fetchPlatformStats,
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from './adminThunks';

const initialState: AdminState = {
  platformStats: null,
  subscriptions: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  selectedSubscription: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSubscription: (state, action: PayloadAction<any>) => {
      state.selectedSubscription = action.payload;
    },
    clearSelectedSubscription: (state) => {
      state.selectedSubscription = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Platform Stats
      .addCase(fetchPlatformStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platformStats = action.payload;
      })
      .addCase(fetchPlatformStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch platform stats';
      })
      // Fetch Subscriptions
      .addCase(fetchSubscriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscriptions = action.payload as any[];
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch subscriptions';
      })
      // Create Subscription
      .addCase(createSubscription.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.isCreating = false;
        state.subscriptions.push(action.payload as any);
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.isCreating = false;
        state.error = (action.payload as string) || 'Failed to create subscription';
      })
      // Update Subscription
      .addCase(updateSubscription.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.isUpdating = false;
        const payload = action.payload as any;
        const index = state.subscriptions.findIndex((sub: any) => sub.id === payload.id);
        if (index !== -1) {
          state.subscriptions[index] = payload;
        }
        if (state.selectedSubscription?.id === payload.id) {
          state.selectedSubscription = payload;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = (action.payload as string) || 'Failed to update subscription';
      })
      // Delete Subscription
      .addCase(deleteSubscription.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedId = action.payload as string;
        state.subscriptions = state.subscriptions.filter((sub: any) => sub.id !== deletedId);
        if (state.selectedSubscription?.id === deletedId) {
          state.selectedSubscription = null;
        }
      })
      .addCase(deleteSubscription.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = (action.payload as string) || 'Failed to delete subscription';
      });
  },
});

export const { clearError, setSelectedSubscription, clearSelectedSubscription } =
  adminSlice.actions;

export default adminSlice.reducer;
