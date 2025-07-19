'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createBillingPortalSession } from '@/store/billing/billingThunks';
import { selectCustomerPortalUrl, selectBillingLoading } from '@/store/billing/billingSelectors';
import Button from '@/components/ui/Button';
import { CreditCardIcon } from '@heroicons/react/24/outline';

interface BillingButtonProps {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export default function BillingButton({
  variant = 'outline',
  size = 'md',
  className = '',
  children,
}: BillingButtonProps) {
  const dispatch = useAppDispatch();
  const customerPortalUrl = useAppSelector(selectCustomerPortalUrl);
  const isLoading = useAppSelector(selectBillingLoading);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBillingPortal = async () => {
    try {
      setIsRedirecting(true);
      setError(null);

      await dispatch(
        createBillingPortalSession({
          returnUrl: `${window.location.origin}/dashboard/billing`,
        }),
      ).unwrap();

      // Redirect to Stripe billing portal
      if (customerPortalUrl) {
        window.location.href = customerPortalUrl;
      }
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);

      // Handle specific error cases
      if (error?.includes('not configured') || error?.includes('configuration')) {
        setError(
          'Billing portal is not configured yet. Please contact support to manage your subscription.',
        );
      } else {
        setError('Unable to access billing portal at this time. Please try again later.');
      }
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <div>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleBillingPortal}
        disabled={isLoading || isRedirecting}
      >
        {isLoading || isRedirecting ? (
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <CreditCardIcon className="w-4 h-4" />
        )}
        {children || 'Manage Billing'}
      </Button>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
          <div className="mt-1">
            <a
              href="mailto:support@intavia.app"
              className="text-red-600 hover:text-red-800 underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
