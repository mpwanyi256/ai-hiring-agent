import { Tables, TablesInsert, TablesUpdate, Json } from '@/lib/supabase';

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
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>;

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

// Admin Permission Types
export interface AdminUser {
  id: string;
  role: 'admin';
  email: string;
  firstName: string;
  lastName: string;
}
