import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BillingState, UserSubscription, SubscriptionPlan } from '@/types/billing';
import {
  fetchSubscriptionPlans,
  createCheckoutSession,
  createPortalSession,
  getUserSubscription,
  checkSubscriptionStatus,
  retryFailedPayment,
  updateBillingNotificationPreferences,
} from './billingThunks';

interface ExtendedBillingState extends BillingState {
  loadingStates: {
    subscription: boolean;
    plans: boolean;
    checkout: boolean;
    portal: boolean;
    statusCheck: boolean;
    paymentRetry: boolean;
    notifications: boolean;
  };
  hasActiveSubscription: boolean;
  lastWebhookUpdate: string | null;
  notificationPreferences: {
    emailReceipts: boolean;
    emailReminders: boolean;
    emailFailures: boolean;
    emailCancellations: boolean;
  };
  retryCount: number;
  maxRetryAttempts: number;
}

const initialState: ExtendedBillingState = {
  subscription: null,
  plans: [],
  isLoading: false,
  error: null,
  customerPortalUrl: null,
  checkoutSessionUrl: null,
  loadingStates: {
    subscription: false,
    plans: false,
    checkout: false,
    portal: false,
    statusCheck: false,
    paymentRetry: false,
    notifications: false,
  },
  hasActiveSubscription: false,
  lastWebhookUpdate: null,
  notificationPreferences: {
    emailReceipts: true,
    emailReminders: true,
    emailFailures: true,
    emailCancellations: true,
  },
  retryCount: 0,
  maxRetryAttempts: 3,
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
    setSpecificLoading: (
      state,
      action: PayloadAction<{ type: keyof ExtendedBillingState['loadingStates']; value: boolean }>,
    ) => {
      state.loadingStates[action.payload.type] = action.payload.value;
    },
    clearBillingData: (state) => {
      state.subscription = null;
      state.customerPortalUrl = null;
      state.checkoutSessionUrl = null;
      state.error = null;
      state.hasActiveSubscription = false;
      state.lastWebhookUpdate = null;
      state.retryCount = 0;
    },
    setSubscription: (state, action: PayloadAction<UserSubscription>) => {
      state.subscription = action.payload;
      state.hasActiveSubscription = ['active', 'trialing'].includes(action.payload.status);
      state.lastWebhookUpdate = new Date().toISOString();
    },
    setPlans: (state, action: PayloadAction<SubscriptionPlan[]>) => {
      state.plans = action.payload;
    },
    clearUrls: (state) => {
      state.customerPortalUrl = null;
      state.checkoutSessionUrl = null;
    },
    updateSubscriptionStatus: (
      state,
      action: PayloadAction<{ status: UserSubscription['status']; updatedAt?: string }>,
    ) => {
      if (state.subscription) {
        state.subscription.status = action.payload.status;
        state.subscription.updated_at = action.payload.updatedAt || new Date().toISOString();
        state.hasActiveSubscription = ['active', 'trialing'].includes(action.payload.status);
        state.lastWebhookUpdate = new Date().toISOString();
      }
    },
    setWebhookUpdate: (state, action: PayloadAction<string>) => {
      state.lastWebhookUpdate = action.payload;
    },
    updateNotificationPreferences: (
      state,
      action: PayloadAction<Partial<ExtendedBillingState['notificationPreferences']>>,
    ) => {
      state.notificationPreferences = { ...state.notificationPreferences, ...action.payload };
    },
    incrementRetryCount: (state) => {
      state.retryCount = Math.min(state.retryCount + 1, state.maxRetryAttempts);
    },
    resetRetryCount: (state) => {
      state.retryCount = 0;
    },
    setActiveSubscriptionStatus: (state, action: PayloadAction<boolean>) => {
      state.hasActiveSubscription = action.payload;
    },
    handleWebhookSubscriptionUpdate: (
      state,
      action: PayloadAction<{
        subscriptionId: string;
        status: UserSubscription['status'];
        currentPeriodStart?: string;
        currentPeriodEnd?: string;
        cancelAtPeriodEnd?: boolean;
      }>,
    ) => {
      if (
        state.subscription &&
        state.subscription.stripe_subscription_id === action.payload.subscriptionId
      ) {
        state.subscription.status = action.payload.status;
        if (action.payload.currentPeriodStart) {
          state.subscription.current_period_start = action.payload.currentPeriodStart;
        }
        if (action.payload.currentPeriodEnd) {
          state.subscription.current_period_end = action.payload.currentPeriodEnd;
        }
        if (action.payload.cancelAtPeriodEnd !== undefined) {
          state.subscription.cancel_at_period_end = action.payload.cancelAtPeriodEnd;
        }
        state.subscription.updated_at = new Date().toISOString();
        state.hasActiveSubscription = ['active', 'trialing'].includes(action.payload.status);
        state.lastWebhookUpdate = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Subscription Plans
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loadingStates.plans = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.loadingStates.plans = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loadingStates.plans = false;
        state.error = action.error.message || 'Failed to fetch subscription plans';
      })
      // Get User Subscription
      .addCase(getUserSubscription.pending, (state) => {
        state.loadingStates.subscription = true;
        state.error = null;
      })
      .addCase(getUserSubscription.fulfilled, (state, action) => {
        state.loadingStates.subscription = false;
        state.subscription = action.payload;
        state.hasActiveSubscription = action.payload
          ? ['active', 'trialing'].includes(action.payload.status)
          : false;
        state.retryCount = 0;
      })
      .addCase(getUserSubscription.rejected, (state, action) => {
        state.loadingStates.subscription = false;
        state.error = action.error.message || 'Failed to fetch subscription';
        state.hasActiveSubscription = false;
        state.retryCount += 1;
      })
      // Check Subscription Status
      .addCase(checkSubscriptionStatus.pending, (state) => {
        state.loadingStates.statusCheck = true;
        state.error = null;
      })
      .addCase(checkSubscriptionStatus.fulfilled, (state, action) => {
        state.loadingStates.statusCheck = false;
        state.subscription = action.payload;
        state.hasActiveSubscription = action.payload
          ? ['active', 'trialing'].includes(action.payload.status)
          : false;
      })
      .addCase(checkSubscriptionStatus.rejected, (state, action) => {
        state.loadingStates.statusCheck = false;
        state.error = action.error.message || 'Failed to check subscription status';
      })
      // Create Checkout Session
      .addCase(createCheckoutSession.pending, (state) => {
        state.loadingStates.checkout = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state, action) => {
        state.loadingStates.checkout = false;
        state.checkoutSessionUrl = action.payload.url;
        window.location.href = action.payload.url;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.loadingStates.checkout = false;
        state.error = action.error.message || 'Failed to create checkout session';
      })
      // Create Billing Portal Session
      .addCase(createPortalSession.pending, (state) => {
        state.loadingStates.portal = true;
        state.error = null;
      })
      .addCase(createPortalSession.fulfilled, (state, action) => {
        state.loadingStates.portal = false;
        state.customerPortalUrl = action.payload.url;
        window.open(action.payload.url, '_blank');
      })
      .addCase(createPortalSession.rejected, (state, action) => {
        state.loadingStates.portal = false;
        state.error = action.error.message || 'Failed to create billing portal session';
      })
      // Retry Failed Payment
      .addCase(retryFailedPayment.pending, (state) => {
        state.loadingStates.paymentRetry = true;
        state.error = null;
      })
      .addCase(retryFailedPayment.fulfilled, (state, action) => {
        state.loadingStates.paymentRetry = false;
        if (action.payload.subscription) {
          state.subscription = { ...state.subscription, ...action.payload.subscription };
        }
      })
      .addCase(retryFailedPayment.rejected, (state, action) => {
        state.loadingStates.paymentRetry = false;
        state.error = action.error.message || 'Failed to retry payment';
      })
      // Update Notification Preferences
      .addCase(updateBillingNotificationPreferences.pending, (state) => {
        state.loadingStates.notifications = true;
        state.error = null;
      })
      .addCase(updateBillingNotificationPreferences.fulfilled, (state, action) => {
        state.loadingStates.notifications = false;
        state.notificationPreferences = action.payload;
      })
      .addCase(updateBillingNotificationPreferences.rejected, (state, action) => {
        state.loadingStates.notifications = false;
        state.error = action.error.message || 'Failed to update notification preferences';
      });
  },
});

export const {
  clearError,
  setLoading,
  setSpecificLoading,
  clearBillingData,
  setSubscription,
  setPlans,
  clearUrls,
  updateSubscriptionStatus,
  setWebhookUpdate,
  updateNotificationPreferences,
  incrementRetryCount,
  resetRetryCount,
  setActiveSubscriptionStatus,
  handleWebhookSubscriptionUpdate,
} = billingSlice.actions;

export default billingSlice.reducer;
