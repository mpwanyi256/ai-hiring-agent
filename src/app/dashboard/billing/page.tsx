'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchSubscription } from '@/store/billing/billingThunks';
import {
  selectSubscription,
  selectCurrentPlan,
  selectTrialDaysRemaining,
  selectIsTrialing,
  selectHasActiveSubscription,
  selectBillingLoading,
} from '@/store/billing/billingSelectors';
import { selectUser } from '@/store/auth/authSelectors';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BillingButton from '@/components/billing/BillingButton';
import { CreditCardIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

function BillingPageContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const subscription = useAppSelector(selectSubscription);
  const currentPlan = useAppSelector(selectCurrentPlan);
  const trialDaysRemaining = useAppSelector(selectTrialDaysRemaining);
  const isTrialing = useAppSelector(selectIsTrialing);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const isLoading = useAppSelector(selectBillingLoading);
  const user = useAppSelector(selectUser);

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  // Fetch subscription data on component mount
  useEffect(() => {
    dispatch(fetchSubscription());
  }, [dispatch]);

  return (
    <DashboardLayout title="Billing & Subscription" requireSubscription={false}>
      <div className="max-w-4xl mx-auto">
        {/* Success/Cancel Messages */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800 font-medium">
                Subscription updated successfully! Your changes will be reflected immediately.
              </p>
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <XMarkIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 font-medium">
                Subscription update was canceled. No changes were made.
              </p>
            </div>
          </div>
        )}

        {/* Current Subscription */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
            {hasActiveSubscription && (
              <BillingButton variant="outline" size="sm">
                Manage Billing
              </BillingButton>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading subscription details...</p>
            </div>
          ) : hasActiveSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{currentPlan?.name}</h3>
                  <p className="text-sm text-gray-600">${currentPlan?.price_monthly}/month</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subscription?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : subscription?.status === 'trialing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {subscription?.status === 'active'
                      ? 'Active'
                      : subscription?.status === 'trialing'
                        ? 'Trial'
                        : subscription?.status}
                  </span>
                </div>
              </div>

              {isTrialing && trialDaysRemaining > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Trial Period:</strong> {trialDaysRemaining} days remaining
                  </p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Plan Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>
                      • Up to {currentPlan?.max_jobs === -1 ? 'Unlimited' : currentPlan?.max_jobs}{' '}
                      active jobs
                    </li>
                    <li>
                      • Up to{' '}
                      {currentPlan?.max_interviews_per_month === -1
                        ? 'Unlimited'
                        : currentPlan?.max_interviews_per_month}{' '}
                      interviews/month
                    </li>
                    <li>• {currentPlan?.trial_days}-day free trial</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Billing Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Status: {subscription?.status}</p>
                    {subscription?.current_period_end && (
                      <p>
                        Next billing:{' '}
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                    {subscription?.cancel_at_period_end && (
                      <p className="text-amber-600">Will cancel at period end</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">
                You don&apos;t have an active subscription. Choose a plan to get started.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
              >
                View Plans
              </a>
            </div>
          )}
        </div>

        {/* Usage Information */}
        {hasActiveSubscription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Active Jobs</h3>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min(((user?.usageCounts?.activeJobs || 0) / (currentPlan?.max_jobs || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {user?.usageCounts?.activeJobs || 0} /{' '}
                    {currentPlan?.max_jobs === -1 ? '∞' : currentPlan?.max_jobs}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.usageCounts?.activeJobs || 0} active jobs this month
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Interviews This Month</h3>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min(((user?.usageCounts?.interviewsThisMonth || 0) / (currentPlan?.max_interviews_per_month || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {user?.usageCounts?.interviewsThisMonth || 0} /{' '}
                    {currentPlan?.max_interviews_per_month === -1
                      ? '∞'
                      : currentPlan?.max_interviews_per_month}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.usageCounts?.interviewsThisMonth || 0} successful interviews this month
                </p>
              </div>
            </div>

            {/* Enhanced Usage Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Current Month Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {user?.usageCounts?.activeJobs || 0}
                  </div>
                  <div className="text-xs text-blue-700">Active Jobs</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {user?.usageCounts?.interviewsThisMonth || 0}
                  </div>
                  <div className="text-xs text-green-700">Interviews</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentPlan?.max_jobs === -1 ? '∞' : currentPlan?.max_jobs || 0}
                  </div>
                  <div className="text-xs text-purple-700">Job Limit</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentPlan?.max_interviews_per_month === -1
                      ? '∞'
                      : currentPlan?.max_interviews_per_month || 0}
                  </div>
                  <div className="text-xs text-orange-700">Interview Limit</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Support Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Billing Support</h3>
              <p className="text-sm text-gray-600 mb-3">
                Have questions about your subscription or billing? We&apos;re here to help.
              </p>
              <a
                href="mailto:support@intavia.app"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Contact Support →
              </a>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Documentation</h3>
              <p className="text-sm text-gray-600 mb-3">
                Learn more about our pricing plans and features.
              </p>
              <a href="/pricing" className="text-primary hover:text-primary/80 text-sm font-medium">
                View Pricing Plans →
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
