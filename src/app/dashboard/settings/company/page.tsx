'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompanyLogoUpload from '@/components/settings/CompanyLogoUpload';
import CompanyFieldRow from '@/components/settings/CompanyFieldRow';
import EditFieldModal from '@/components/settings/EditFieldModal';
import { fetchCompanyData } from '@/store/company/companyThunks';
import { useAppDispatch } from '@/store';
import { selectCompany, selectCompanyLoading } from '@/store/company/companySelectors';
import { apiError } from '@/lib/notification';
import { selectUser } from '@/store/auth/authSelectors';

export default function CompanySettingsPage() {
  const dispatch = useAppDispatch();
  const [modalField, setModalField] = useState<null | 'name' | 'bio'>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const company = useAppSelector(selectCompany);
  const isLoading = useAppSelector(selectCompanyLoading);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!user?.companyId) return;
    const fetchCompany = async () => {
      try {
        console.log('fetching company data');
        const ok = await dispatch(fetchCompanyData()).unwrap();

        if (!ok) {
          apiError('Failed to load company data');
        }
      } catch (error) {
        apiError(error instanceof Error ? error.message : 'Failed to load company data');
      }
    };
    fetchCompany();
  }, [user?.companyId, dispatch]);

  // Modal save handler
  const handleModalSave = async (newValue: string) => {
    // if (!company || !modalField) return;
    // setModalLoading(true);
    // setModalError(null);
    // try {
    //   const response = await apiUtils.put<APIResponse<ClientCompany>>(`/api/company/${company.id}`, {
    //     [modalField]: newValue,
    //   });
    //   if (response.error) throw response.error;
    //   dispatch(fetchCompanyData());
    //   setModalField(null);
    //   setMessage({ type: 'success', text: 'Updated successfully!' });
    // } catch (error) {
    //   setModalError('Failed to update');
    // } finally {
    //   setModalLoading(false);
    // }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          {/* Logo Upload */}
          <div className="mb-8 flex flex-col items-center w-full">
            <CompanyLogoUpload currentLogoUrl={company?.logo_url} disabled={isLoading} />
          </div>

          {/* Fields */}
          <div className="w-full flex flex-col divide-y divide-gray-100">
            <CompanyFieldRow
              label="Name"
              value={company?.name || <span className="text-gray-400">Not set</span>}
              onEdit={() => setModalField('name')}
            />
            <CompanyFieldRow
              label="About"
              value={company?.bio || <span className="text-gray-400">Not set</span>}
              onEdit={() => setModalField('bio')}
            />
          </div>
        </div>

        {/* Edit Modal */}
        <EditFieldModal
          open={!!modalField}
          onClose={() => setModalField(null)}
          label={modalField === 'name' ? 'Name' : 'Bio'}
          value={modalField ? company?.[modalField] || '' : ''}
          onSave={handleModalSave}
          inputType={modalField === 'bio' ? 'textarea' : 'text'}
          loading={modalLoading}
          error={modalError}
        />
      </div>
    </DashboardLayout>
  );
}
