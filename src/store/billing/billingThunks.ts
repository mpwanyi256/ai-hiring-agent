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

// Track ongoing requests to prevent duplicates
let fetchSubscriptionPromise: Promise<any> | null = null;

// Fetch user's current subscription (using user_details view for consistency)
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

      // Create the promise and store it
      fetchSubscriptionPromise = (async () => {
        // Use the user_details view (same as auth API) for consistency
        const { data, error } = await supabase
          .from('user_details')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user details:', error);
          throw error;
        }

        // Check if user has an active subscription
        if (!data.subscription_id || !data.subscription_status) {
          console.log('No active subscription found for user');
          throw new Error('No active subscription found');
        }

        // Transform the user_details data to match UserSubscription format
        const subscription: UserSubscription = {
          id: data.subscription_id,
          user_id: user.id,
          subscription_id: data.subscription_id,
          status: data.subscription_status,
          started_at: data.subscription_started_at || new Date().toISOString(),
          expires_at: data.subscription_expires_at,
          current_period_start: data.subscription_started_at,
          current_period_end: data.subscription_expires_at,
          trial_start: undefined, // Not available in user_details
          trial_end: undefined, // Not available in user_details
          cancel_at_period_end: false, // Not available in user_details
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id,
          created_at: data.user_created_at,
          updated_at: data.user_updated_at,
          subscriptions: {
            id: data.subscription_id,
            name: data.subscription_name,
            description: data.subscription_description,
            price_monthly: data.price_monthly,
            price_yearly: data.price_yearly,
            max_jobs: data.max_jobs,
            max_interviews_per_month: data.max_interviews_per_month,
            features: data.subscription_features,
            trial_days: 30, // Default trial days
            interval: 'month',
            is_active: true,
            stripe_price_id: data.stripe_price_id_dev, // Use dev price ID as default
            created_at: data.company_created_at,
            updated_at: data.user_updated_at,
          },
        };
        return subscription;
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

      console.log('Found subscription plans from database:', data);
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
      const environment = isDev ? 'development' : 'production';

      // Use the database helper function to get the correct price ID
      const { data: priceIdResult, error: priceIdError } = await supabase.rpc(
        'get_stripe_price_id',
        {
          subscription_name: plan.name,
          environment: environment,
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
