import { Tables, TablesInsert, TablesUpdate, Json } from '@/lib/supabase/types';

// Platform Statistics Types
export interface PlatformStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalCompanies: number;
  activeJobs: number;
  completedInterviews: number;
  totalCandidates: number;
}

// Subscription Types
export type Subscription = Tables<'subscriptions'>;
export type SubscriptionInsert = TablesInsert<'subscriptions'>;
export type AdminSubscriptionUpdate = TablesUpdate<'subscriptions'>;

// Simplified subscription type for Redux state to avoid TypeScript depth issues
export interface SimpleSubscription {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  max_jobs: number | null;
  max_interviews_per_month: number | null;
  trial_days: number | null;
  is_active: boolean | null;
  features: Json | null;
  interval: string | null;
  stripe_product_id: string | null;
  stripe_price_id_dev: string | null;
  stripe_price_id_dev_yearly: string | null;
  stripe_price_id_prod: string | null;
  stripe_price_id_prod_yearly: string | null;
  stripe_checkout_link_dev: string | null;
  stripe_checkout_link_dev_yearly: string | null;
  stripe_checkout_link_prod: string | null;
  stripe_checkout_link_prod_yearly: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Admin State Types
export interface AdminState {
  platformStats: PlatformStats | null;
  subscriptions: any[];
  users: UserDetails[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  selectedSubscription: any;
}

// API Response Types
export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export type PlatformStatsResponse = AdminApiResponse<PlatformStats>;
export type SubscriptionsResponse = AdminApiResponse<Subscription[]>;
export type SubscriptionResponse = AdminApiResponse<Subscription>;
export type DeleteSubscriptionResponse = AdminApiResponse<{ id: string }>;

// Form Data Types
export interface SubscriptionFormData {
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  max_jobs: number | null;
  max_interviews_per_month: number | null;
  trial_days: number | null;
  is_active: boolean;
  features: string[];
  // Stripe Integration Fields
  stripe_product_id: string | null;
  stripe_price_id_dev: string | null;
  stripe_price_id_dev_yearly: string | null;
  stripe_price_id_prod: string | null;
  stripe_price_id_prod_yearly: string | null;
  stripe_checkout_link_dev: string | null;
  stripe_checkout_link_dev_yearly: string | null;
  stripe_checkout_link_prod: string | null;
  stripe_checkout_link_prod_yearly: string | null;
}

// Component Props Types
export interface AdminDashboardProps {
  className?: string;
}

export interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export interface SubscriptionFormProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  subscription?: Subscription;
  onClose: () => void;
  onSubmit: (data: SubscriptionFormData) => void;
  isSubmitting: boolean;
}

export interface PlatformStatsCardProps {
  stats: PlatformStats;
  isLoading: boolean;
}

// User Details from user_details view
export interface UserDetails {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  user_created_at: string | null;
  user_updated_at: string | null;
  company_id: string | null;
  company_name: string | null;
  company_slug: string | null;
  company_created_at: string | null;
  subscription_id: string | null;
  subscription_name: string | null;
  subscription_description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  max_jobs: number | null;
  max_interviews_per_month: number | null;
  subscription_features: string[] | null;
  stripe_price_id_dev: string | null;
  stripe_price_id_prod: string | null;
  stripe_price_id_dev_yearly: string | null;
  stripe_price_id_prod_yearly: string | null;
  stripe_checkout_link_dev: string | null;
  stripe_checkout_link_prod: string | null;
  stripe_checkout_link_dev_yearly: string | null;
  stripe_checkout_link_prod_yearly: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_updated_at: string | null;
  active_jobs_count: number | null;
  interviews_this_month: number | null;
  last_sign_in_at: string | null; // This will be added from auth.users
}

// Admin Permission Types
export interface AdminUser {
  id: string;
  role: 'admin';
  email: string;
  firstName: string;
  lastName: string;
}
