import DashboardLayout from '../layout/DashboardLayout';
import Button from './Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface DashboardErrorProps {
  title: string;
  message: string;
  onBack?: () => void;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({ title, message, onBack }) => {
  const router = useRouter();
  return (
    <DashboardLayout title="Job Details">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => (onBack ? onBack() : router.push('/dashboard/jobs'))}
            className="flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex flex-col gap-4 items-center p-8 text-center">
          <Image
            src="/illustrations/404.svg"
            alt="404"
            width={500}
            height={500}
            objectFit="contain"
          />
          <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
          <p className="text-muted-text mb-6">{message}</p>
          <Button onClick={() => router.push('/dashboard/jobs')}>Return</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
