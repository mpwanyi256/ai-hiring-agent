'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import {
  MagnifyingGlassIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface UserSubscription {
  id: string;
  profile_id: string;
  user_name: string;
  user_email: string;
  company_name: string | null;
  subscription_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminUserSubscriptions() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };

  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch subscriptions data
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/user-subscriptions');

        if (!response.ok) {
          throw new Error('Failed to fetch subscriptions');
        }

        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
        setFilteredSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchSubscriptions();
    }
  }, [user]);

  // Filter subscriptions based on search and filters
  useEffect(() => {
    let filtered = subscriptions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sub.company_name && sub.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          sub.subscription_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sub.stripe_customer_id &&
            sub.stripe_customer_id.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter]);

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd && status === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Canceling
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'canceled':
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Canceled
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Past Due
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Trial
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isTrialActive = (trialEnd: string | null) => {
    if (!trialEnd) return false;
    return new Date(trialEnd) > new Date();
  };

  const getDaysUntilEnd = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const activeCount = subscriptions.filter((sub) => sub.status === 'active').length;
  const trialCount = subscriptions.filter((sub) => sub.status === 'trialing').length;
  const canceledCount = subscriptions.filter(
    (sub) => sub.status === 'canceled' || sub.status === 'cancelled',
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Subscriptions</h1>
              <p className="text-gray-600 mt-1">
                Track and manage all user subscriptions across the platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                {activeCount} Active
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {trialCount} Trial
              </div>
              <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {canceledCount} Canceled
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trialing">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading subscriptions</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">User Subscriptions</h2>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-6 text-center">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'No subscriptions found matching your filters.'
                  : 'No subscriptions found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stripe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.user_name}
                          </div>
                          <div className="text-sm text-gray-500">{subscription.user_email}</div>
                          {subscription.company_name && (
                            <div className="text-xs text-gray-400">{subscription.company_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.subscription_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(subscription.current_period_start)} -{' '}
                          {formatDate(subscription.current_period_end)}
                        </div>
                        {subscription.current_period_end && (
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const days = getDaysUntilEnd(subscription.current_period_end);
                              if (days === null) return '';
                              if (days < 0) return `Expired ${Math.abs(days)} days ago`;
                              if (days === 0) return 'Expires today';
                              if (days === 1) return 'Expires tomorrow';
                              return `Expires in ${days} days`;
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.trial_start && subscription.trial_end ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatDate(subscription.trial_start)} -{' '}
                              {formatDate(subscription.trial_end)}
                            </div>
                            <div
                              className={`text-xs ${isTrialActive(subscription.trial_end) ? 'text-blue-600' : 'text-gray-500'}`}
                            >
                              {isTrialActive(subscription.trial_end) ? 'Active' : 'Expired'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No trial</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {subscription.stripe_customer_id && (
                            <div>
                              Customer: {subscription.stripe_customer_id.substring(0, 12)}...
                            </div>
                          )}
                          {subscription.stripe_subscription_id && (
                            <div>
                              Sub: {subscription.stripe_subscription_id.substring(0, 12)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
