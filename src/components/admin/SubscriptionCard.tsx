import React from 'react';
import { Subscription } from '@/types/admin';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{subscription.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              subscription.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {subscription.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            ${subscription.price_monthly}/month • ${subscription.price_yearly}/year
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <UsersIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Up to {subscription.max_jobs} jobs</span>
        </div>

        <div className="flex items-center space-x-2">
          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {subscription.max_interviews_per_month} interviews/month
          </span>
        </div>

        {subscription.trial_days && subscription.trial_days > 0 && (
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">{subscription.trial_days} day free trial</span>
          </div>
        )}
      </div>

      {subscription.features &&
        Array.isArray(subscription.features) &&
        subscription.features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
            <ul className="space-y-1">
              {(subscription.features as string[]).map((feature, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(subscription)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Edit</span>
        </button>

        <button
          onClick={() => onDelete(subscription.id)}
          disabled={isDeleting}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
