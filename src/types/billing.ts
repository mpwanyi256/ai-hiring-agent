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
