import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminState, Subscription } from '@/types/admin';
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
    setSelectedSubscription: (state, action: PayloadAction<Subscription | null>) => {
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
        state.subscriptions = action.payload;
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
        state.subscriptions.push(action.payload);
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
        const index = state.subscriptions.findIndex((sub) => sub.id === action.payload.id);
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
        if (state.selectedSubscription?.id === action.payload.id) {
          state.selectedSubscription = action.payload;
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
        state.subscriptions = state.subscriptions.filter((sub) => sub.id !== action.payload);
        if (state.selectedSubscription?.id === action.payload) {
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
