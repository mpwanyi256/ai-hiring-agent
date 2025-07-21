'use client';

import { useAppSelector, useAppDispatch } from '@/store';
import SidePanel from '@/components/ui/SidePanel';
import { useEffect, useState, useContext, createContext, useCallback } from 'react';
import { fetchSubscriptionPlans } from '@/store/billing/billingThunks';
import { selectSubscriptionPlans, selectCurrentPlan } from '@/store/billing/billingSelectors';
import SubscriptionCard from '@/components/billing/SubscriptionCard';
import { usePathname } from 'next/navigation';

// Context for controlling the modal globally
const SubscriptionModalContext = createContext<{
  open: () => void;
  close: () => void;
} | null>(null);

export function useSubscriptionModal() {
  return useContext(SubscriptionModalContext);
}

export const SubscriptionModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const plans = useAppSelector(selectSubscriptionPlans);
  const currentPlan = useAppSelector(selectCurrentPlan);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Only show on dashboard page
  useEffect(() => {
    if (!user) return;
    if (pathname !== '/dashboard') {
      setShowSubscriptionPanel(false);
      return;
    }
    if (!user.subscription || !['active', 'trialing'].includes(user.subscription.status)) {
      setShowSubscriptionPanel(true);
    } else if (
      user.subscription.maxJobs !== -1 &&
      user.usageCounts.activeJobs >= user.subscription.maxJobs
    ) {
      setShowSubscriptionPanel(true);
    } else {
      setShowSubscriptionPanel(false);
    }
  }, [user, pathname]);

  // Fetch plans if not loaded
  useEffect(() => {
    if (showSubscriptionPanel && plans.length === 0) {
      dispatch(fetchSubscriptionPlans());
    }
  }, [showSubscriptionPanel, plans.length, dispatch]);

  const open = useCallback(() => setShowSubscriptionPanel(true), []);
  const close = useCallback(() => setShowSubscriptionPanel(false), []);

  return (
    <SubscriptionModalContext.Provider value={{ open, close }}>
      {children}
      <SidePanel
        isOpen={showSubscriptionPanel}
        onClose={close}
        title="Choose a Subscription Plan"
        width="lg"
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Subscription Plans</h2>
            <div className="flex items-center gap-2">
              <button
                className={`px-4 py-1 rounded-full font-medium text-sm transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
                }`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-1 rounded-full font-medium text-sm transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-primary/10'
                }`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
          {/* Scrollable plans section */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            <div className="flex flex-col gap-6">
              {plans.map((plan) => (
                <SubscriptionCard
                  key={plan.id}
                  plan={plan}
                  billingPeriod={billingPeriod}
                  isRecommended={plan.name.toLowerCase() === 'pro'}
                  isCurrentPlan={currentPlan?.id === plan.id}
                />
              ))}
            </div>
          </div>
          {/* Taxes note always visible at the bottom */}
          <div className="text-center text-xs text-gray-500 border-t pt-4 bg-white shrink-0">
            All prices exclude applicable taxes. Taxes are calculated at checkout based on your
            billing address.
          </div>
        </div>
      </SidePanel>
    </SubscriptionModalContext.Provider>
  );
};
