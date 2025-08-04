import { createAsyncThunk } from '@reduxjs/toolkit';
import { createClient } from '@/lib/supabase/client';
import type { BillingNotificationPreferences } from '@/types/billing';

// Fetch user's current subscription (using user_details view for consistency)
export const fetchSubscription = createAsyncThunk<UserSubscription, void>(
  'billing/fetchSubscription',
  async (_, { rejectWithValue, getState }) => {
    try {
      const user = (getState() as RootState).auth.user;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const { data, success } = await apiUtils.get<APIResponse<UserSubscription>>(
        `/api/billing/subscription/${user.id}`,
      );

      if (!success) {
        throw new Error('Failed to fetch subscription');
      }

      // Check if user has an active subscription
      if (!data.subscription_id || !data) {
        console.log('No active subscription found for user');
        throw new Error('No active subscription found');
      }
      return data;
    } catch {
      return rejectWithValue('Failed to fetch subscription');
    }
  },
);

// Fetch available subscription plans from database
export const fetchSubscriptionPlans = createAsyncThunk<SubscriptionPlan[], void>(
  'billing/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching subscription plans from database...');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) {
        console.error('Error fetching subscription plans from database:', error);
        throw error;
      }
      return data as SubscriptionPlan[];
    } catch (error: any) {
      console.error('Failed to fetch subscription plans:', error);
      return rejectWithValue(error.message || 'Failed to fetch subscription plans');
    }
  },
);

export const createCheckoutSession = createAsyncThunk(
  'billing/createCheckoutSession',
  async ({ planId, userId }: { planId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const createPortalSession = createAsyncThunk(
  'billing/createPortalSession',
  async ({ customerId }: { customerId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const getUserSubscription = createAsyncThunk(
  'billing/getUserSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(
          `
          *,
          subscriptions (
            name,
            description,
            max_jobs,
            max_interviews_per_month
          )
        `,
        )
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return subscription;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const retryFailedPayment = createAsyncThunk(
  'billing/retryFailedPayment',
  async (
    { paymentMethodId, subscriptionId }: { paymentMethodId: string; subscriptionId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch('/api/billing/retry-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId, subscriptionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry payment');
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const checkSubscriptionStatus = createAsyncThunk(
  'billing/checkSubscriptionStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(
          `
          *,
          subscriptions (
            name,
            description,
            max_jobs,
            max_interviews_per_month
          )
        `,
        )
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return subscription;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const updateBillingNotificationPreferences = createAsyncThunk(
  'billing/updateNotificationPreferences',
  async (preferences: BillingNotificationPreferences, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('billing_notification_preferences')
        .upsert(preferences, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);
