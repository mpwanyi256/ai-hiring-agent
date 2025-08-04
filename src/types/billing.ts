export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  interval: 'month' | 'year';
  features: string[];
  max_jobs: number;
  max_interviews_per_month: number;
  stripe_price_id: string;
  trial_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  status:
    | 'active'
    | 'canceled'
    | 'past_due'
    | 'unpaid'
    | 'trialing'
    | 'cancelled'
    | 'expired'
    | 'paused';
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  started_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Joined subscription data
  subscriptions?: SubscriptionPlan;
}

export interface BillingState {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  customerPortalUrl: string | null;
  checkoutSessionUrl: string | null;
}

export interface ExtendedBillingState extends BillingState {
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
  notificationPreferences: BillingNotificationPreferences;
  retryCount: number;
  maxRetryAttempts: number;
}

export interface BillingNotificationPreferences {
  emailReceipts: boolean;
  emailReminders: boolean;
  emailFailures: boolean;
  emailCancellations: boolean;
}

export interface CreateCheckoutSessionData {
  planId: string;
  successUrl: string;
  cancelUrl: string;
  billingPeriod?: 'monthly' | 'yearly';
}

export interface BillingPortalData {
  returnUrl: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface UsageMetrics {
  activeJobs: number;
  interviewsThisMonth: number;
  jobsLimit: number;
  interviewsLimit: number;
  jobsUsagePercentage: number;
  interviewsUsagePercentage: number;
}

export interface PaymentFailure {
  invoiceId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  dueDate: string;
  attempts: number;
  lastAttempt: string;
  paymentUrl?: string;
}

export interface BillingAlert {
  id: string;
  type: 'trial_ending' | 'payment_failed' | 'subscription_cancelled' | 'payment_reminder';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  dismissible: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  eventData: Record<string, any>;
  status: 'success' | 'error';
  errorMessage?: string;
  createdAt: string;
}

export interface BillingEmailData {
  type:
    | 'subscription_created'
    | 'subscription_cancelled'
    | 'subscription_ended'
    | 'payment_failed'
    | 'payment_receipt'
    | 'payment_reminder'
    | 'trial_ending';
  to: string;
  data: Record<string, any>;
}

export interface SubscriptionUpdate {
  subscriptionId: string;
  status: UserSubscription['status'];
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  updatedAt?: string;
}

export type PlanInterval = 'month' | 'year';

export interface Plan {
  [key: string]: {
    link: string;
    priceId: string;
    price: number;
    interval: PlanInterval;
  };
}

export enum SubscriptionNames {
  BUSINESS = 'business',
  PRO = 'pro',
  STARTER = 'starter',
}

export type SubscriptionPlans = Record<SubscriptionNames, Plan>;

// Enhanced billing analytics
export interface BillingAnalytics {
  revenue: {
    monthly: number;
    yearly: number;
    total: number;
  };
  subscriptions: {
    active: number;
    trialing: number;
    cancelled: number;
    pastDue: number;
  };
  churn: {
    rate: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  paymentFailures: {
    count: number;
    recoveryRate: number;
  };
}
