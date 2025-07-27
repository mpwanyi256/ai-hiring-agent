import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Subscription, SubscriptionFormData } from '@/types/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SubscriptionFormProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  subscription?: Subscription;
  onClose: () => void;
  onSubmit: (data: SubscriptionFormData) => void;
  isSubmitting: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  isOpen,
  mode,
  subscription,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'stripe'>('basic');
  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    max_jobs: 0,
    max_interviews_per_month: 0,
    trial_days: 0,
    is_active: true,
    features: [],
    stripe_product_id: '',
    stripe_price_id_dev: '',
    stripe_price_id_dev_yearly: '',
    stripe_price_id_prod: '',
    stripe_price_id_prod_yearly: '',
    stripe_checkout_link_dev: '',
    stripe_checkout_link_dev_yearly: '',
    stripe_checkout_link_prod: '',
    stripe_checkout_link_prod_yearly: '',
  });

  useEffect(() => {
    if (subscription && mode === 'edit') {
      setFormData({
        name: subscription.name,
        description: subscription.description,
        price_monthly: subscription.price_monthly,
        price_yearly: subscription.price_yearly,
        max_jobs: subscription.max_jobs,
        max_interviews_per_month: subscription.max_interviews_per_month,
        trial_days: subscription.trial_days,
        is_active: subscription.is_active || false,
        features: (subscription.features as string[]) || [],
        stripe_product_id: subscription.stripe_product_id || '',
        stripe_price_id_dev: subscription.stripe_price_id_dev || '',
        stripe_price_id_dev_yearly: subscription.stripe_price_id_dev_yearly || '',
        stripe_price_id_prod: subscription.stripe_price_id_prod || '',
        stripe_price_id_prod_yearly: subscription.stripe_price_id_prod_yearly || '',
        stripe_checkout_link_dev: subscription.stripe_checkout_link_dev || '',
        stripe_checkout_link_dev_yearly: subscription.stripe_checkout_link_dev_yearly || '',
        stripe_checkout_link_prod: subscription.stripe_checkout_link_prod || '',
        stripe_checkout_link_prod_yearly: subscription.stripe_checkout_link_prod_yearly || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        max_jobs: 0,
        max_interviews_per_month: 0,
        trial_days: 0,
        is_active: true,
        features: [],
        stripe_product_id: '',
        stripe_price_id_dev: '',
        stripe_price_id_dev_yearly: '',
        stripe_price_id_prod: '',
        stripe_price_id_prod_yearly: '',
        stripe_checkout_link_dev: '',
        stripe_checkout_link_dev_yearly: '',
        stripe_checkout_link_prod: '',
        stripe_checkout_link_prod_yearly: '',
      });
    }
    // Reset tab to basic when opening
    setActiveTab('basic');
  }, [subscription, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFeaturesChange = (value: string) => {
    const features = value.split('\n').filter((f) => f.trim());
    setFormData({ ...formData, features });
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing & Limits' },
    { id: 'stripe', label: 'Stripe Integration' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create Subscription Plan' : 'Edit Subscription Plan'}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Professional"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Active Plan
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Plan description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features (one per line)
                  </label>
                  <textarea
                    value={formData.features.join('\n')}
                    onChange={(e) => handleFeaturesChange(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>
              </div>
            )}

            {/* Pricing & Limits Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.price_monthly || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, price_monthly: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yearly Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.price_yearly || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, price_yearly: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Jobs</label>
                    <input
                      type="number"
                      value={formData.max_jobs || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, max_jobs: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Interviews/Month
                    </label>
                    <input
                      type="number"
                      value={formData.max_interviews_per_month || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_interviews_per_month: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Days
                    </label>
                    <input
                      type="number"
                      value={formData.trial_days || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, trial_days: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stripe Integration Tab */}
            {activeTab === 'stripe' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stripe Product ID
                  </label>
                  <input
                    type="text"
                    value={formData.stripe_product_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, stripe_product_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="prod_..."
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Development Environment</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Price ID (Dev)
                      </label>
                      <input
                        type="text"
                        value={formData.stripe_price_id_dev || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, stripe_price_id_dev: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="price_..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yearly Price ID (Dev)
                      </label>
                      <input
                        type="text"
                        value={formData.stripe_price_id_dev_yearly || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, stripe_price_id_dev_yearly: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="price_..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Checkout Link (Dev)
                      </label>
                      <input
                        type="url"
                        value={formData.stripe_checkout_link_dev || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, stripe_checkout_link_dev: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://checkout.stripe.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yearly Checkout Link (Dev)
                      </label>
                      <input
                        type="url"
                        value={formData.stripe_checkout_link_dev_yearly || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stripe_checkout_link_dev_yearly: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://checkout.stripe.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Production Environment</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Price ID (Prod)
                      </label>
                      <input
                        type="text"
                        value={formData.stripe_price_id_prod || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, stripe_price_id_prod: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="price_..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yearly Price ID (Prod)
                      </label>
                      <input
                        type="text"
                        value={formData.stripe_price_id_prod_yearly || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, stripe_price_id_prod_yearly: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="price_..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Checkout Link (Prod)
                      </label>
                      <input
                        type="url"
                        value={formData.stripe_checkout_link_prod || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, stripe_checkout_link_prod: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://checkout.stripe.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yearly Checkout Link (Prod)
                      </label>
                      <input
                        type="url"
                        value={formData.stripe_checkout_link_prod_yearly || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stripe_checkout_link_prod_yearly: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://checkout.stripe.com/..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-row justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>

            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="px-6 py-2 text-sm"
            >
              {mode === 'create'
                ? isSubmitting
                  ? 'Creating...'
                  : 'Create Plan'
                : isSubmitting
                  ? 'Updating...'
                  : 'Update Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
