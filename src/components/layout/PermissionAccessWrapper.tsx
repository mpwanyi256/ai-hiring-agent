import Image from 'next/image';
import DashboardLayout from './DashboardLayout';
import { Button } from '../ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface PermissionAccessWrapperProps {
  title?: string;
  message?: string;
}

export const PermissionAccessWrapper: React.FC<PermissionAccessWrapperProps> = ({
  title = 'Permission Access',
  message = 'You do not have permission to access this page.',
}) => {
  const router = useRouter();
  const backButton = (
    <Button variant="outline" size="icon" onClick={() => router.back()}>
      <ArrowLeftIcon className="w-4 h-4" />
    </Button>
  );
  return (
    <DashboardLayout leftNode={backButton}>
      <div className="h-[calc(100vh-185px)] flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-2 h-full justify-center items-center">
          <Image src="/illustrations/secure_page.svg" alt="No Access" width={300} height={300} />
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};
