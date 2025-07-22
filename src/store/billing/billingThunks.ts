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
import { isDev } from '@/lib/constants';
import { apiUtils } from '../api';
import { apiError } from '@/lib/notification';

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

// Create Stripe checkout session using database
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

      // Get the plan from database to get the correct price ID
      const supabase = createClient();
      const { data: plan, error: planError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('name', checkoutData.planId.toLowerCase())
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        throw new Error(`Plan ${checkoutData.planId} not found in database`);
      }

      // Determine billing period and get appropriate price ID
      const billingPeriod = checkoutData.billingPeriod || 'monthly';

      // Use the database helper function to get the correct price ID
      const { data: priceIdResult, error: priceIdError } = await supabase.rpc(
        'get_stripe_price_id',
        {
          subscription_name: plan.name,
          environment: isDev ? 'development' : 'production',
          billing_period: billingPeriod,
        },
      );

      if (priceIdError || !priceIdResult) {
        throw new Error(`Failed to get price ID for plan ${plan.name}`);
      }

      const priceId = priceIdResult;
      const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...checkoutData,
          userId: user.id,
          userEmail: user.email,
          priceId, // Pass the price ID from database
          price, // Pass the price from database
          planName: plan.name, // Pass plan name for metadata
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
      const { data, success } = await apiUtils.post<APIResponse<{ url: string }>>(
        '/api/billing/create-portal-session',
        portalData,
      );

      if (!success) {
        throw new Error('Failed to create billing portal session');
      }

      return data;
    } catch {
      apiError('Something went wrong. Please try again later.');
      return rejectWithValue('Something went wrong. Please try again later.');
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
