import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import {
  PlatformStats,
  PlatformStatsResponse,
  Subscription,
  SubscriptionsResponse,
  SubscriptionResponse,
  DeleteSubscriptionResponse,
  SubscriptionInsert,
  SubscriptionUpdate,
} from '@/types/admin';

export const fetchPlatformStats = createAsyncThunk<PlatformStats>(
  'admin/fetchPlatformStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<PlatformStatsResponse>('/api/admin/stats');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch platform stats');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch platform stats';
      return rejectWithValue(message);
    }
  },
);

export const fetchSubscriptions = createAsyncThunk<Subscription[]>(
  'admin/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<SubscriptionsResponse>('/api/admin/subscriptions');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch subscriptions');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch subscriptions';
      return rejectWithValue(message);
    }
  },
);

export const createSubscription = createAsyncThunk<Subscription, SubscriptionInsert>(
  'admin/createSubscription',
  async (subscriptionData, { rejectWithValue }) => {
    try {
      const response = await apiUtils.post<SubscriptionResponse>(
        '/api/admin/subscriptions',
        subscriptionData,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to create subscription');
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create subscription';
      return rejectWithValue(message);
    }
  },
);

export const updateSubscription = createAsyncThunk<
  Subscription,
  { id: string; updates: SubscriptionUpdate }
>('admin/updateSubscription', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const response = await apiUtils.put<SubscriptionResponse>(
      `/api/admin/subscriptions/${id}`,
      updates,
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update subscription');
    }

    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update subscription';
    return rejectWithValue(message);
  }
});

export const deleteSubscription = createAsyncThunk<string, string>(
  'admin/deleteSubscription',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiUtils.delete<DeleteSubscriptionResponse>(
        `/api/admin/subscriptions/${id}`,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete subscription');
      }

      return response.data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete subscription';
      return rejectWithValue(message);
    }
  },
);
