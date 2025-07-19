import { createAsyncThunk } from '@reduxjs/toolkit';
import { createClient } from '@/lib/supabase/client';
import {
  UserSubscription,
  SubscriptionPlan,
  CreateCheckoutSessionData,
  BillingPortalData,
} from '@/types/billing';
import { APIResponse } from '@/types';
import { RootState } from '..';

// Track ongoing requests to prevent duplicates
let fetchSubscriptionPromise: Promise<any> | null = null;

// Fetch user's current subscription
export const fetchSubscription = createAsyncThunk<UserSubscription, void>(
  'billing/fetchSubscription',
  async (_, { rejectWithValue }) => {
    try {
      // If there's already a request in progress, wait for it
      if (fetchSubscriptionPromise) {
        console.log('Subscription fetch already in progress, waiting...');
        return await fetchSubscriptionPromise;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching subscription for user:', user.id);

      // Create the promise and store it
      fetchSubscriptionPromise = (async () => {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(
            `
            *,
            subscriptions (
              id,
              name,
              max_jobs,
              max_interviews_per_month,
              stripe_price_id,
              price_monthly,
              features
            )
          `,
          )
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .single();

        if (error) {
          console.error('Error fetching subscription:', error);
          throw error;
        }

        console.log('Found subscription:', data);
        return data as UserSubscription;
      })();

      const result = await fetchSubscriptionPromise;

      // Clear the promise after completion
      fetchSubscriptionPromise = null;

      return result;
    } catch (error: any) {
      // Clear the promise on error
      fetchSubscriptionPromise = null;
      console.error('Failed to fetch subscription:', error);
      return rejectWithValue(error.message || 'Failed to fetch subscription');
    }
  },
);

// Fetch available subscription plans
export const fetchSubscriptionPlans = createAsyncThunk<SubscriptionPlan[], void>(
  'billing/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      console.log('Fetching subscription plans...');

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) {
        console.error('Error fetching subscription plans:', error);
        throw error;
      }

      console.log('Found subscription plans:', data);
      return data as SubscriptionPlan[];
    } catch (error: any) {
      console.error('Failed to fetch subscription plans:', error);
      return rejectWithValue(error.message || 'Failed to fetch subscription plans');
    }
  },
);

// Create Stripe checkout session
export const createCheckoutSession = createAsyncThunk<{ url: string }, CreateCheckoutSessionData>(
  'billing/createCheckoutSession',
  async (checkoutData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;

      const user = state.auth.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating checkout session for plan:', checkoutData.planId);

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...checkoutData,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const result: APIResponse<{ url: string }> = await response.json();

      if (!result.success) {
        console.error('Checkout session creation failed:', result.error);
        throw new Error(result.error || 'Failed to create checkout session');
      }

      console.log('Checkout session created successfully');
      return result.data;
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      return rejectWithValue(error.message || 'Failed to create checkout session');
    }
  },
);

// Create Stripe billing portal session
export const createBillingPortalSession = createAsyncThunk<{ url: string }, BillingPortalData>(
  'billing/createBillingPortalSession',
  async (portalData, { rejectWithValue }) => {
    try {
      console.log('Creating billing portal session...');

      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portalData),
      });

      const result: APIResponse<{ url: string }> = await response.json();

      if (!result.success) {
        console.error('Billing portal session creation failed:', result.error);

        // Check if it's a configuration error
        if (response.status === 503 && (result as any).needsConfiguration) {
          throw new Error(
            'Billing portal not configured. Please contact support to manage your subscription.',
          );
        }

        throw new Error(result.error || 'Failed to create billing portal session');
      }

      console.log('Billing portal session created successfully');
      return result.data;
    } catch (error: any) {
      console.error('Failed to create billing portal session:', error);
      return rejectWithValue(error.message || 'Failed to create billing portal session');
    }
  },
);

// Check if user has an active subscription
export const checkSubscriptionStatus = createAsyncThunk<boolean, void>(
  'billing/checkSubscriptionStatus',
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      console.log('Checking subscription status for user:', user.id);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error checking subscription status:', error);
        throw error;
      }

      const hasActiveSubscription = !!data;
      console.log('User has active subscription:', hasActiveSubscription);
      return hasActiveSubscription;
    } catch (error: any) {
      console.error('Failed to check subscription status:', error);
      return rejectWithValue(error.message || 'Failed to check subscription status');
    }
  },
);
