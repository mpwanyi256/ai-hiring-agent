// Stripe TypeScript types based on official Stripe API documentation
// These types ensure we're accessing the correct properties on Stripe objects

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  application?: string | null;
  application_fee_percent?: number | null;
  automatic_tax: {
    enabled: boolean;
    liability?: any;
  };
  billing_cycle_anchor: number;
  billing_cycle_anchor_config?: any;
  billing_thresholds?: any;
  cancel_at?: number | null;
  cancel_at_period_end: boolean;
  canceled_at?: number | null;
  cancellation_details?: {
    comment?: string | null;
    feedback?: string | null;
    reason?: string | null;
  };
  collection_method: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  current_period_end: number;
  current_period_start: number;
  customer: string;
  days_until_due?: number | null;
  default_payment_method?: string | null;
  default_source?: string | null;
  default_tax_rates: any[];
  description?: string | null;
  discount?: any;
  discounts?: string[];
  ended_at?: number | null;
  invoice_settings: any;
  items: {
    object: 'list';
    data: any[];
    has_more: boolean;
    total_count: number;
    url: string;
  };
  latest_invoice?: string | null;
  livemode: boolean;
  metadata: Record<string, string>;
  next_pending_invoice_item_invoice?: number | null;
  on_behalf_of?: string | null;
  pause_collection?: any;
  payment_settings?: any;
  pending_invoice_item_interval?: any;
  pending_setup_intent?: string | null;
  pending_update?: any;
  schedule?: string | null;
  start_date: number;
  status:
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'paused';
  test_clock?: string | null;
  transfer_data?: any;
  trial_end?: number | null;
  trial_settings?: any;
  trial_start?: number | null;
}

export interface StripeInvoice {
  id: string;
  object: 'invoice';
  account_country?: string | null;
  account_name?: string | null;
  account_tax_ids?: string[] | null;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  amount_shipping: number;
  application?: string | null;
  application_fee_amount?: number | null;
  attempt_count: number;
  attempted: boolean;
  auto_advance?: boolean;
  automatic_tax: {
    enabled: boolean;
    liability?: any;
    status?: string | null;
  };
  billing_reason?: string | null;
  charge?: string | null;
  collection_method: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  custom_fields?: any[] | null;
  customer: string;
  customer_address?: any | null;
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_shipping?: any | null;
  customer_tax_exempt?: string | null;
  customer_tax_ids?: any[];
  default_payment_method?: string | null;
  default_source?: string | null;
  default_tax_rates: any[];
  description?: string | null;
  discount?: any | null;
  discounts: string[];
  due_date?: number | null;
  ending_balance?: number | null;
  footer?: string | null;
  from_invoice?: any | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  issuer?: any;
  last_finalization_error?: any | null;
  latest_revision?: string | null;
  lines: {
    object: 'list';
    data: any[];
    has_more: boolean;
    total_count: number;
    url: string;
  };
  livemode: boolean;
  metadata: Record<string, string>;
  next_payment_attempt?: number | null;
  number?: string | null;
  on_behalf_of?: string | null;
  paid?: boolean;
  paid_out_of_band?: boolean;
  payment_intent?: string | null;
  payment_settings: any;
  period_end: number;
  period_start: number;
  post_payment_credit_notes_amount: number;
  pre_payment_credit_notes_amount: number;
  quote?: string | null;
  receipt_number?: string | null;
  rendering?: any | null;
  shipping_cost?: any | null;
  shipping_details?: any | null;
  starting_balance: number;
  statement_descriptor?: string | null;
  status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | null;
  status_transitions: {
    finalized_at?: number | null;
    marked_uncollectible_at?: number | null;
    paid_at?: number | null;
    voided_at?: number | null;
  };
  subscription?: string | null;
  subtotal: number;
  subtotal_excluding_tax?: number | null;
  tax?: number | null;
  test_clock?: string | null;
  total: number;
  total_discount_amounts?: any[];
  total_excluding_tax?: number | null;
  total_tax_amounts: any[];
  transfer_data?: any | null;
  webhooks_delivered_at?: number | null;
}

export interface StripeCheckoutSession {
  id: string;
  object: 'checkout.session';
  after_expiration?: any | null;
  allow_promotion_codes?: boolean | null;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  automatic_tax: {
    enabled: boolean;
    liability?: any;
    status?: string | null;
  };
  billing_address_collection?: string | null;
  cancel_url?: string | null;
  client_reference_id?: string | null;
  client_secret?: string | null;
  consent?: any | null;
  consent_collection?: any | null;
  created: number;
  currency?: string | null;
  currency_conversion?: any | null;
  custom_fields: any[];
  custom_text: any;
  customer?: string | null;
  customer_creation?: string | null;
  customer_details?: any | null;
  customer_email?: string | null;
  expires_at: number;
  invoice?: string | null;
  invoice_creation?: any | null;
  livemode: boolean;
  locale?: string | null;
  metadata: Record<string, string>;
  mode: 'payment' | 'setup' | 'subscription';
  payment_intent?: string | null;
  payment_link?: string | null;
  payment_method_collection?: string | null;
  payment_method_configuration_details?: any | null;
  payment_method_options?: any;
  payment_method_types: string[];
  payment_status: string;
  phone_number_collection?: any;
  recovered_from?: string | null;
  redirect_on_completion?: string | null;
  return_url?: string | null;
  saved_payment_method_options?: any | null;
  setup_intent?: string | null;
  shipping_address_collection?: any | null;
  shipping_cost?: any | null;
  shipping_details?: any | null;
  shipping_options: any[];
  status?: 'open' | 'complete' | 'expired' | null;
  submit_type?: string | null;
  subscription?: string | null;
  success_url?: string | null;
  total_details?: any | null;
  ui_mode?: string | null;
  url?: string | null;
}

export interface StripeEvent {
  id: string;
  object: 'event';
  api_version?: string | null;
  created: number;
  data: {
    object: StripeSubscription | StripeInvoice | StripeCheckoutSession | any;
    previous_attributes?: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id?: string | null;
    idempotency_key?: string | null;
  } | null;
  type: string;
}

// Helper types for webhook event data objects
export type WebhookEventData<T = any> = {
  object: T;
  previous_attributes?: Partial<T>;
};

// Database query result types
export interface UserSubscriptionRecord {
  id: string;
  user_id: string;
  status: string;
  old_status?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  subscription_id: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  started_at: string;
  updated_at: string;
  created_at: string;
}
