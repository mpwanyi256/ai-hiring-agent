'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { fetchContractById } from '@/store/contracts/contractsThunks';
import {
  selectCurrentContract,
  selectContractsLoading,
  selectContractsError,
} from '@/store/contracts/contractsSelectors';
import ContractForm from '@/components/contracts/ContractForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function EditContractPage() {
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const contractId = params.id as string;
  const contract = useSelector(selectCurrentContract);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);

  useEffect(() => {
    if (contractId) {
      dispatch(fetchContractById(contractId));
    }
  }, [dispatch, contractId]);

  if (loading && !contract) {
    return (
      <DashboardLayout title="Edit Contract" loading>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Edit Contract">
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link href="/dashboard/contracts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout title="Edit Contract">
        <div className="space-y-6">
          <Alert>
            <AlertDescription>Contract not found.</AlertDescription>
          </Alert>
          <Link href="/dashboard/contracts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit ${contract.title}`}>
      <ContractForm contract={contract} mode="edit" />
    </DashboardLayout>
  );
}
