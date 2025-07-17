'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompanyLogoUpload from '@/components/settings/CompanyLogoUpload';
import CompanyFieldRow from '@/components/settings/CompanyFieldRow';
import EditFieldModal from '@/components/settings/EditFieldModal';
import TimezonePicker from '@/components/interviews/TimezonePicker';
import {
  updateCompanyDetails,
  fetchCompanyData,
  uploadCompanyLogo,
} from '@/store/company/companyThunks';
import { useAppDispatch } from '@/store';
import {
  selectCompany,
  selectCompanyLoading,
  selectCompanyTimezones,
} from '@/store/company/companySelectors';
import { apiError } from '@/lib/notification';
import { selectUser } from '@/store/auth/authSelectors';

export default function CompanySettingsPage() {
  const dispatch = useAppDispatch();
  const [modalField, setModalField] = useState<null | 'name' | 'bio'>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const timezones = useAppSelector(selectCompanyTimezones);
  const [updatingTimezone, setUpdatingTimezone] = useState(false);
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
    if (!modalField) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await dispatch(updateCompanyDetails({ [modalField]: newValue })).unwrap();
      setModalField(null);
      dispatch(fetchCompanyData());
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setModalLoading(false);
    }
  };

  // Logo upload handler
  const handleLogoFileSelected = async (file: File) => {
    setLogoUploading(true);
    try {
      await dispatch(uploadCompanyLogo(file)).unwrap();
      dispatch(fetchCompanyData());
    } catch (error) {
      apiError(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Timezone update handler
  const handleTimezoneUpdate = async (timezoneId: string) => {
    setUpdatingTimezone(true);
    try {
      await dispatch(updateCompanyDetails({ timezoneId })).unwrap();
      dispatch(fetchCompanyData());
    } catch (error) {
      apiError(error instanceof Error ? error.message : 'Failed to update timezone');
    } finally {
      setUpdatingTimezone(false);
    }
  };

  const getCurrentTimezoneDisplay = () => {
    if (!company?.timezoneId) {
      return <span className="text-gray-400">Not set</span>;
    }

    const timezone = timezones.find((tz) => tz.id === company.timezoneId);
    if (!timezone) {
      return <span className="text-gray-400">Unknown timezone</span>;
    }

    const formatOffset = (hours: number, minutes: number) => {
      const sign = hours >= 0 ? '+' : '';
      const hourStr = Math.abs(hours).toString().padStart(2, '0');
      const minuteStr = minutes.toString().padStart(2, '0');
      return `${sign}${hourStr}:${minuteStr}`;
    };

    return (
      <div>
        <div className="font-medium text-gray-900">{timezone.displayName}</div>
        <div className="text-sm text-gray-500">
          {timezone.city && timezone.country
            ? `${timezone.city}, ${timezone.country.name}`
            : timezone.country?.name || timezone.name}{' '}
          ({formatOffset(timezone.offsetHours, timezone.offsetMinutes)})
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout loading={isLoading}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-16 flex flex-col items-center">
          {/* Logo Upload */}
          <div className="mb-8 flex flex-col items-center w-full">
            <CompanyLogoUpload
              logoUrl={company?.logo_url}
              disabled={isLoading}
              isUploading={logoUploading}
              onFileSelected={handleLogoFileSelected}
            />
            <div className="text-xs text-gray-500 mt-2">
              Drag and drop or Click to upload a new logo
            </div>
            <p className="text-xs text-gray-500 mb-2 text-center">
              Recommended size: 200x200px. Max file size: 5MB.
            </p>
          </div>

          {/* Fields */}
          <div className="w-full flex flex-col divide-y divide-gray-100">
            <CompanyFieldRow
              label="Name"
              value={company?.name || <span className="text-gray-400">Not set</span>}
              onEdit={() => setModalField('name')}
            />
            <CompanyFieldRow
              label="Bio"
              value={
                company?.bio ? (
                  <span
                    className="text-sm text-gray-900 break-all prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: company.bio }}
                  />
                ) : (
                  <span className="text-gray-400">Not set</span>
                )
              }
              onEdit={() => setModalField('bio')}
            />

            {/* Timezone Field */}
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Default Timezone</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This timezone will be used as the default for scheduling interviews
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">{getCurrentTimezoneDisplay()}</div>

                  <TimezonePicker
                    value={company?.timezoneId || ''}
                    onChange={handleTimezoneUpdate}
                    timezones={timezones}
                    disabled={updatingTimezone}
                    label="Change Timezone"
                    placeholder="Select a new timezone"
                  />

                  {updatingTimezone && (
                    <div className="text-sm text-gray-500">Updating timezone...</div>
                  )}
                </div>
              </div>
            </div>
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
          richText={modalField === 'bio'}
          loading={modalLoading}
          error={modalError}
        />
      </div>
    </DashboardLayout>
  );
}
