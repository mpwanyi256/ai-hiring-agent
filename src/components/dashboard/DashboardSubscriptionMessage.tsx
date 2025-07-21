import { Suspense, useState } from 'react';

import { XMarkIcon } from '@heroicons/react/24/outline';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const DashboardSubscriptionMessage = () => {
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessMessage(true);
      // Auto-hide after 15 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!showSuccessMessage) return null;

  return (
    <Suspense fallback={null}>
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Subscription Activated Successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Welcome to your new plan! You now have access to all the features.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-400 hover:text-green-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Suspense>
  );
};
