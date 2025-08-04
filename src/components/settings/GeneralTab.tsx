import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import CompanyLogoUpload from '@/components/settings/CompanyLogoUpload';
import CompanyFieldRow from '@/components/settings/CompanyFieldRow';
import EditFieldModal from '@/components/settings/EditFieldModal';
import TimezonePicker from '@/components/interviews/TimezonePicker';
import {
  updateCompanyDetails,
  fetchCompanyData,
  uploadCompanyLogo,
} from '@/store/company/companyThunks';
import {
  selectCompany,
  selectCompanyLoading,
  selectCompanyTimezones,
} from '@/store/company/companySelectors';
import { selectIsCompanyOwner } from '@/store/settings/settingsSelectors';
import { apiError } from '@/lib/notification';
import { selectUser } from '@/store/auth/authSelectors';
import { BuildingOffice2Icon, ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function GeneralTab() {
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
  const isCompanyOwner = useAppSelector(selectIsCompanyOwner);

  useEffect(() => {
    if (!user?.companyId) return;
    const fetchCompany = async () => {
      try {
        await dispatch(fetchCompanyData()).unwrap();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Company Branding</h2>
        <p className="text-muted-text">
          Customize your company&apos;s appearance and default settings for a consistent experience.
        </p>
      </div>

      {/* Company Logo Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <PhotoIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Company Logo</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">
            Upload your company logo to personalize your hiring experience
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex flex-col items-center space-y-4">
            <CompanyLogoUpload
              logoUrl={company?.logo_url}
              disabled={isLoading}
              isUploading={logoUploading}
              onFileSelected={handleLogoFileSelected}
            />
            <div className="text-center">
              <p className="text-sm text-muted-text">Drag and drop or click to upload a new logo</p>
              <p className="text-xs text-muted-text mt-1">
                Recommended: 200×200px, PNG or JPG, max 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Information Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BuildingOffice2Icon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Company Information</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">Basic information about your company</p>
        </div>
        <div className="px-6 py-6 space-y-6">
          <CompanyFieldRow
            label="Company Name"
            value={company?.name || <span className="text-gray-400">Not set</span>}
            onEdit={() => setModalField('name')}
            disabled={!isCompanyOwner}
          />
          <CompanyFieldRow
            label="Company Description"
            value={
              company?.bio ? (
                <span
                  className="text-sm text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: company.bio }}
                />
              ) : (
                <span className="text-gray-400">Add a company description</span>
              )
            }
            onEdit={() => setModalField('bio')}
            disabled={!isCompanyOwner}
          />
        </div>
      </div>

      {/* Default Settings Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text">Default Settings</h3>
          </div>
          <p className="text-sm text-muted-text mt-1">
            Configure default settings for your organization
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Default Timezone</label>
              <p className="text-sm text-muted-text mb-4">
                This timezone will be used as the default for scheduling interviews and
                notifications
              </p>

              {/* Current Timezone Display */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Timezone</p>
                    <div className="mt-1">{getCurrentTimezoneDisplay()}</div>
                  </div>
                  {updatingTimezone && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </div>
              </div>

              {/* Timezone Picker */}
              <TimezonePicker
                value={company?.timezoneId || ''}
                onChange={handleTimezoneUpdate}
                timezones={timezones}
                disabled={updatingTimezone}
                label="Change Timezone"
                placeholder="Select a new timezone"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditFieldModal
        open={!!modalField}
        onClose={() => setModalField(null)}
        label={modalField === 'name' ? 'Company Name' : 'Company Description'}
        value={modalField ? company?.[modalField] || '' : ''}
        onSave={handleModalSave}
        inputType={modalField === 'bio' ? 'textarea' : 'text'}
        richText={modalField === 'bio'}
        loading={modalLoading}
        error={modalError}
      />
    </div>
  );
}
