import ContractForm from '@/components/contracts/ContractForm';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NewContractPage() {
  return (
    <DashboardLayout>
      <ContractForm mode="create" />
    </DashboardLayout>
  );
}
