'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState, useAppDispatch } from '@/store';
import {
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '@/store/admin/adminThunks';
import {
  setSelectedSubscription,
  clearSelectedSubscription,
  clearError,
} from '@/store/admin/adminSlice';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { User, SimpleSubscription, SubscriptionFormData } from '@/types';
import { SubscriptionForm } from '@/components/admin/SubscriptionForm';
import { PlusIcon, XMarkIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function AdminSubscriptions() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth) as { user: User | null };
  const {
    subscriptions,
    selectedSubscription,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  } = useSelector((state: RootState) => state.admin);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchSubscriptions());
    }
  }, [dispatch, user]);

  const handleCreate = async (formData: SubscriptionFormData) => {
    try {
      await dispatch(
        createSubscription({
          name: formData.name,
          description: formData.description,
          price_monthly: formData.price_monthly,
          price_yearly: formData.price_yearly,
          max_jobs: formData.max_jobs,
          max_interviews_per_month: formData.max_interviews_per_month,
          trial_days: formData.trial_days,
          is_active: formData.is_active,
          features: formData.features,
          stripe_price_id_dev: formData.stripe_price_id_dev,
          stripe_price_id_dev_yearly: formData.stripe_price_id_dev_yearly,
          stripe_price_id_prod: formData.stripe_price_id_prod,
          stripe_price_id_prod_yearly: formData.stripe_price_id_prod_yearly,
          stripe_product_id: formData.stripe_product_id,
          stripe_checkout_link_dev: formData.stripe_checkout_link_dev,
          stripe_checkout_link_dev_yearly: formData.stripe_checkout_link_dev_yearly,
          stripe_checkout_link_prod: formData.stripe_checkout_link_prod,
          stripe_checkout_link_prod_yearly: formData.stripe_checkout_link_prod_yearly,
        }),
      ).unwrap();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const handleUpdate = async (formData: SubscriptionFormData) => {
    if (!selectedSubscription) return;

    try {
      await dispatch(
        updateSubscription({
          id: selectedSubscription.id,
          updates: {
            name: formData.name,
            description: formData.description,
            price_monthly: formData.price_monthly,
            price_yearly: formData.price_yearly,
            max_jobs: formData.max_jobs,
            max_interviews_per_month: formData.max_interviews_per_month,
            trial_days: formData.trial_days,
            is_active: formData.is_active,
            features: formData.features,
            stripe_price_id_dev: formData.stripe_price_id_dev,
            stripe_price_id_dev_yearly: formData.stripe_price_id_dev_yearly,
            stripe_price_id_prod: formData.stripe_price_id_prod,
            stripe_price_id_prod_yearly: formData.stripe_price_id_prod_yearly,
            stripe_product_id: formData.stripe_product_id,
            stripe_checkout_link_dev: formData.stripe_checkout_link_dev,
            stripe_checkout_link_dev_yearly: formData.stripe_checkout_link_dev_yearly,
            stripe_checkout_link_prod: formData.stripe_checkout_link_prod,
            stripe_checkout_link_prod_yearly: formData.stripe_checkout_link_prod_yearly,
          },
        }),
      ).unwrap();
      setShowEditModal(false);
      dispatch(clearSelectedSubscription());
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm('Are you sure you want to delete this subscription? This action cannot be undone.')
    ) {
      try {
        await dispatch(deleteSubscription(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete subscription:', error);
      }
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const openEditModal = (subscription: SimpleSubscription) => {
    dispatch(setSelectedSubscription(subscription));
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    dispatch(clearSelectedSubscription());
  };

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-gray-600 mt-1">
                Create and manage subscription plans for the platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={openCreateModal} className="flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Create Plan</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => dispatch(clearError())}
              className="text-red-700 hover:text-red-900"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No subscription plans found.</p>
              <Button onClick={openCreateModal} className="mt-4">
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trial
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {subscription.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${subscription.price_monthly}/mo
                        </div>
                        <div className="text-sm text-gray-500">${subscription.price_yearly}/yr</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subscription.max_jobs} jobs</div>
                        <div className="text-sm text-gray-500">
                          {subscription.max_interviews_per_month} interviews/mo
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscription.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscription.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subscription.trial_days ? `${subscription.trial_days} days` : 'No trial'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(subscription)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit subscription"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subscription.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                            title="Delete subscription"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Form */}
        <SubscriptionForm
          isOpen={showCreateModal || showEditModal}
          mode={showCreateModal ? 'create' : 'edit'}
          subscription={selectedSubscription || undefined}
          onClose={closeModals}
          onSubmit={showCreateModal ? handleCreate : handleUpdate}
          isSubmitting={isCreating || isUpdating}
        />
      </div>
    </DashboardLayout>
  );
}
