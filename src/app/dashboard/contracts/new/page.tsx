'use client';
import ContractForm from '@/components/contracts/ContractForm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { selectIsOnStarterPlan } from '@/store/billing/billingSelectors';
import { useAppSelector } from '@/store';
import { FeatureSubscriptionCard } from '@/components/billing/FeatureSubscriptionCard';

export default function NewContractPage() {
  const isOnStarterPlan = useAppSelector(selectIsOnStarterPlan);

  if (isOnStarterPlan) {
    return (
      <FeatureSubscriptionCard
        title="Upgrade to Pro to create contracts"
        subtitle="Sorry, your plan does not include this feature. You can upgrade your plan to start creating contracts."
      />
    );
  }

  return (
    <DashboardLayout>
      <ContractForm mode="create" />
    </DashboardLayout>
  );
}
