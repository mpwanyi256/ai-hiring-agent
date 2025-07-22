import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BillingState, UserSubscription, SubscriptionPlan } from '@/types/billing';
import {
  fetchSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  fetchSubscriptionPlans,
} from './billingThunks';

const initialState: BillingState = {
  subscription: null,
  plans: [],
  isLoading: false,
  error: null,
  customerPortalUrl: null,
  checkoutSessionUrl: null,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearBillingData: (state) => {
      state.subscription = null;
      state.customerPortalUrl = null;
      state.checkoutSessionUrl = null;
      state.error = null;
    },
    setSubscription: (state, action: PayloadAction<UserSubscription>) => {
      state.subscription = action.payload;
    },
    setPlans: (state, action: PayloadAction<SubscriptionPlan[]>) => {
      state.plans = action.payload;
    },
    clearUrls: (state) => {
      state.customerPortalUrl = null;
      state.checkoutSessionUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch subscription';
      })
      // Create Checkout Session
      .addCase(createCheckoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkoutSessionUrl = action.payload.url;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create checkout session';
      })
      // Create Billing Portal Session
      .addCase(createBillingPortalSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBillingPortalSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customerPortalUrl = action.payload.url;
        window.open(action.payload.url, '_blank');
      })
      .addCase(createBillingPortalSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create billing portal session';
      })
      // Fetch Subscription Plans
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch subscription plans';
      });
  },
});

export const { clearError, setLoading, clearBillingData, setSubscription, setPlans, clearUrls } =
  billingSlice.actions;

export default billingSlice.reducer;
