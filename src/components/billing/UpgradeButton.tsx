'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { createCheckoutSession, createPortalSession } from '@/store/billing/billingThunks';
import { selectSubscription, selectBillingLoading } from '@/store/billing/billingSelectors';
import { selectUser } from '@/store/auth/authSelectors';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon, ArrowDownIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { SubscriptionPlan } from '@/types/billing';

interface UpgradeButtonProps {
  targetPlan?: SubscriptionPlan;
  billingPeriod?: 'monthly' | 'yearly';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export default function UpgradeButton({
  targetPlan,
  billingPeriod = 'monthly',
  variant = 'default',
  size = 'default',
  className = '',
  children,
  showIcon = true,
}: UpgradeButtonProps) {
  const dispatch = useAppDispatch();
  const subscription = useAppSelector(selectSubscription);
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectBillingLoading);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPlan = subscription?.subscriptions;
  const isCurrentPlan = targetPlan && currentPlan && targetPlan.id === currentPlan.id;

  // Determine if this is an upgrade or downgrade
  const isUpgrade =
    targetPlan && currentPlan ? targetPlan.price_monthly > currentPlan.price_monthly : true;

  const handlePlanChange = async () => {
    if (!user?.id) {
      console.error('User ID not available');
      return;
    }

    setIsProcessing(true);

    try {
      if (targetPlan) {
        // Create checkout session for specific plan
        const result = await dispatch(
          createCheckoutSession({
            planId: targetPlan.name,
            userId: user.id,
            billingPeriod,
          }),
        ).unwrap();

        if (result?.url) {
          window.location.href = result.url;
        }
      } else {
        // No target plan - either go to pricing page or billing portal
        if (subscription?.stripe_customer_id) {
          // User has subscription - go to billing portal
          const result = await dispatch(createPortalSession()).unwrap();
          if (result?.url) {
            window.open(result.url, '_blank');
          }
        } else {
          // No subscription - go to pricing page
          window.location.href = '/pricing';
        }
      }
    } catch (error) {
      console.error('Failed to handle plan change:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (children) return children;
    if (isCurrentPlan) return 'Current Plan';
    if (!targetPlan) return 'Manage Subscription';
    return isUpgrade ? 'Upgrade Plan' : 'Change Plan';
  };

  const getIcon = () => {
    if (!showIcon) return null;
    if (isCurrentPlan) return <CreditCardIcon className="w-4 h-4 mr-1" />;
    if (!targetPlan) return <CreditCardIcon className="w-4 h-4 mr-1" />;
    return isUpgrade ? (
      <ArrowUpIcon className="w-4 h-4 mr-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 mr-1" />
    );
  };

  return (
    <Button
      variant={isCurrentPlan ? 'ghost' : variant}
      size={size}
      className={className}
      onClick={handlePlanChange}
      disabled={isCurrentPlan || isLoading || isProcessing || !user?.id}
    >
      {isLoading || isProcessing ? (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        getIcon()
      )}
      {getButtonText()}
    </Button>
  );
}
