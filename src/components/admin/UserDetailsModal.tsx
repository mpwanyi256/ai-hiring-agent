'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { UserDetails } from '@/types/admin';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetails | null;
}

export default function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  if (!user) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastActive = (lastSignIn: string | null) => {
    if (!lastSignIn) return 'Never';

    const date = new Date(lastSignIn);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getStatusBadge = (lastSignIn: string | null) => {
    if (!lastSignIn) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Never Active
        </span>
      );
    }

    const date = new Date(lastSignIn);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Recently Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'employer':
        return 'bg-blue-100 text-blue-800';
      case 'recruiter':
        return 'bg-green-100 text-green-800';
      case 'candidate':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    User Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* User Profile Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 truncate">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : 'Unknown User'}
                        </h3>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-lg mb-3">{user.email}</p>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(user.last_sign_in_at)}
                        <span className="text-sm text-gray-500">
                          Joined {formatDate(user.user_created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Company Overview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                        <h4 className="text-lg font-semibold text-gray-900">Company</h4>
                      </div>
                    </div>
                    {user.company_name ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Organization</p>
                          <p className="text-lg font-semibold text-gray-900">{user.company_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Active Jobs</p>
                            <p className="text-xl font-bold text-green-600">
                              {user.active_jobs_count || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Interviews/Month</p>
                            <p className="text-xl font-bold text-blue-600">
                              {user.interviews_this_month || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <ExclamationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No company assigned</p>
                      </div>
                    )}
                  </div>

                  {/* Subscription Overview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <CreditCardIcon className="h-5 w-5 text-purple-600" />
                        <h4 className="text-lg font-semibold text-gray-900">Subscription</h4>
                      </div>
                    </div>
                    {user.subscription_name ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Plan</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {user.subscription_name}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.subscription_status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : user.subscription_status === 'trialing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.subscription_status === 'active' && (
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'trialing' && (
                                <ClockIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'cancelled' && (
                                <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'canceled' && (
                                <XCircleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'past_due' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'unpaid' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'expired' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'paused' && (
                                <PauseIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'incomplete' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'incomplete_expired' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'incomplete' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'incomplete_expired' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'incomplete' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                              {user.subscription_status === 'incomplete_expired' && (
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Monthly</p>
                            <p className="text-lg font-bold text-gray-900">
                              ${user.price_monthly ? Number(user.price_monthly).toFixed(0) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Max Jobs</p>
                            <p className="text-lg font-bold text-gray-900">
                              {user.max_jobs === -1 ? '∞' : user.max_jobs || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <ExclamationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No active subscription</p>
                      </div>
                    )}
                  </div>

                  {/* Activity Overview */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-5 w-5 text-indigo-600" />
                        <h4 className="text-lg font-semibold text-gray-900">Activity</h4>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Active</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatLastActive(user.last_sign_in_at)}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Account Created</p>
                        <p className="text-sm text-gray-700">{formatDate(user.user_created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details (Collapsible) */}
                {user.subscription_features && user.subscription_features.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Subscription Features
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {user.subscription_features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
