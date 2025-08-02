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
import { Loader2, ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ContractPreviewModal from '@/components/contracts/ContractPreviewModal';

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

  // Back button component
  const backButton = (
    <Link href="/dashboard/contracts">
      <Button variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </Link>
  );

  // Action buttons component - only render when contract is fully loaded
  const actionButtons = contract ? (
    <div className="flex items-center gap-2">
      <ContractPreviewModal
        contract={{
          title: contract.title || '',
          body: contract.content || '',
          jobTitle: contract.jobTitle || undefined,
          employmentType: contract.employmentType || undefined,
          contractDuration: contract.contractDuration || '',
          category: contract.category || 'general',
          status: contract.status || 'draft',
        }}
        trigger={
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        }
      />
      <Button type="submit" form="contract-form" size="sm">
        <Save className="h-4 w-4 mr-2" />
        Save Changes
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled>
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      <Button size="sm" disabled>
        <Save className="h-4 w-4 mr-2" />
        Save Changes
      </Button>
    </div>
  );

  if (loading && !contract) {
    return (
      <DashboardLayout
        title="Edit Contract Template"
        subtitle="Update your contract template"
        leftNode={backButton}
        loading
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Edit Contract Template"
        subtitle="Update your contract template"
        leftNode={backButton}
      >
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout
        title="Edit Contract Template"
        subtitle="Update your contract template"
        leftNode={backButton}
      >
        <div className="space-y-6">
          <Alert>
            <AlertDescription>Contract not found.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Contract Template"
      subtitle="Update your contract template"
      leftNode={backButton}
      rightNode={actionButtons}
    >
      <ContractForm contract={contract} mode="edit" />
    </DashboardLayout>
  );
}
