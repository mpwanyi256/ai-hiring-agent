'use client';

import { useAppSelector } from '@/store';
import Modal from '@/components/ui/Modal';
import { useEffect, useState } from 'react';

export const SubscriptionModal = () => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  useEffect(() => {
    if (!user) return;
    if (!user.subscription || !['active', 'trialing'].includes(user.subscription.status)) {
      setShowSubscriptionModal(true);
    } else if (
      user.subscription.maxJobs !== -1 &&
      user.usageCounts.activeJobs >= user.subscription.maxJobs
    ) {
      setShowSubscriptionModal(true);
    } else {
      setShowSubscriptionModal(false);
    }
  }, [user]);

  return (
    <Modal
      isOpen={showSubscriptionModal}
      onClose={() => setShowSubscriptionModal(false)}
      title="Subscription Required"
    >
      <div className="mb-4">
        {!user?.subscription || !['active', 'trialing'].includes(user.subscription?.status) ? (
          <>
            <p className="text-red-600 mb-2 font-medium">
              You need an active subscription to use the dashboard.
            </p>
            <p className="mb-2">Please subscribe to a plan to unlock all features.</p>
          </>
        ) : (
          <>
            <p className="text-red-600 mb-2 font-medium">
              You have reached your job posting limit for your current plan.
            </p>
            <p className="mb-2">Upgrade your plan to create more jobs.</p>
          </>
        )}
        <a
          href="/pricing"
          className="inline-block mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          View Plans
        </a>
      </div>
    </Modal>
  );
};
