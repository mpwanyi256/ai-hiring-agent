import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  BillingNotificationPreferences,
  SubscriptionPlan,
  UserSubscription,
} from '@/types/billing';
import { apiUtils } from '../api';
import { APIResponse } from '@/types';
import { RootState } from '..';

export const createCheckoutSession = createAsyncThunk(
  'billing/createCheckoutSession',
  async (
    {
      planId,
      userId,
      billingPeriod = 'monthly',
    }: {
      planId: string;
      userId: string;
      billingPeriod?: 'monthly' | 'yearly';
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiUtils.post<APIResponse<{ url: string }>>(
        '/api/billing/create-checkout-session',
        {
          planId,
          userId,
          billingPeriod,
        },
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const createPortalSession = createAsyncThunk(
  'billing/createPortalSession',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const subscription = state.billing.subscription;
      if (!subscription?.stripe_customer_id) {
        throw new Error('No customer ID found. Please contact support.');
      }

      const response = await apiUtils.post<APIResponse<{ url: string }>>(
        '/api/billing/create-portal-session',
        {
          customerId: subscription.stripe_customer_id,
        },
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

// Fetch available subscription plans from database
export const fetchSubscriptionPlans = createAsyncThunk<SubscriptionPlan[], void>(
  'billing/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<APIResponse<SubscriptionPlan[]>>(
        '/api/billing/subscriptions',
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch subscription plans',
      );
    }
  },
);

export const getUserSubscription = createAsyncThunk<
  UserSubscription | null,
  void,
  {
    rejectValue: string;
    getState: () => RootState;
  }
>('billing/getUserSubscription', async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState() as RootState;
    const user = state.auth.user;

    if (!user || !user.id) {
      return rejectWithValue('You need to be authenticated');
    }

    const response = await apiUtils.get<APIResponse<UserSubscription | null>>(
      `/api/billing/subscriptions/${user.id}`,
    );
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const retryFailedPayment = createAsyncThunk(
  'billing/retryFailedPayment',
  async (
    { paymentMethodId, subscriptionId }: { paymentMethodId: string; subscriptionId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiUtils.post<APIResponse<{ url: string }>>(
        '/api/billing/retry-payment',
        {
          paymentMethodId,
          subscriptionId,
        },
      );

      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const checkSubscriptionStatus = createAsyncThunk(
  'billing/checkSubscriptionStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<APIResponse<UserSubscription | null>>(
        `/api/billing/subscription-status/${userId}`,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const updateBillingNotificationPreferences = createAsyncThunk(
  'billing/updateNotificationPreferences',
  async (preferences: BillingNotificationPreferences, { rejectWithValue }) => {
    try {
      const response = await apiUtils.post<APIResponse<BillingNotificationPreferences>>(
        '/api/billing/notification-preferences',
        preferences,
      );
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);
