'use client';
import { Button } from '@/components/ui/button';
import DashboardLayout from '../layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FeatureSubscriptionCardProps {
  title: string;
  subtitle: string;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const FeatureSubscriptionCard: React.FC<FeatureSubscriptionCardProps> = ({
  title = 'Upgrade to Pro to access this feature',
  subtitle = 'Sorry, your plan does not include this feature. You can upgrade your plan now to unlock all features.',
  pageTitle = '',
  pageSubtitle = '',
}) => {
  const router = useRouter();
  return (
    <div>
      <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center flex flex-col gap-2 w-[70%]">
            <div className="flex items-center justify-center bg-primary/10 p-4 w-[210px] h-[210px] mx-auto border border-primary/20 rounded-full">
              <Image
                src="/illustrations/laptop_secure.svg"
                alt="Subscription Card"
                width={200}
                height={200}
              />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4 text-center mx-auto">{subtitle}</p>
            <Button className="w-fit mx-auto" onClick={() => router.push('/pricing')}>
              Upgrade Now
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
};
