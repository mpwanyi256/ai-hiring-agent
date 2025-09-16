import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  JobFormData,
  Department,
  JobTitle,
  EmploymentType,
  WorkplaceType,
  JobType,
} from '@/types/jobs';
import { Button } from '@/components/ui/button';
import ComboboxWithCreate from '@/components/ui/ComboboxWithCreate';
import CurrencySelect from '@/components/ui/CurrencySelect';

interface JobCreateStep1Props {
  form: UseFormReturn<JobFormData>;
  jobTitles: JobTitle[];
  jobTitlesLoading: boolean;
  jobTitleSearch: string;
  setJobTitleSearch: (v: string) => void;
  jobTitleDropdownOpen: boolean;
  setJobTitleDropdownOpen: (v: boolean) => void;
  departments: Department[];
  departmentsLoading: boolean;
  departmentSearch: string;
  setDepartmentSearch: (v: string) => void;
  departmentDropdownOpen: boolean;
  setDepartmentDropdownOpen: (v: boolean) => void;
  employmentTypes: EmploymentType[];
  employmentTypesLoading: boolean;
  employmentTypeSearch: string;
  setEmploymentTypeSearch: (v: string) => void;
  employmentTypeDropdownOpen: boolean;
  setEmploymentTypeDropdownOpen: (v: boolean) => void;
  workplaceTypes: { value: WorkplaceType; label: string }[];
  jobTypes: { value: JobType; label: string }[];
  onNext: () => void;
  onCreateJobTitle: (name: string) => Promise<void>;
  onCreateDepartment: (name: string) => Promise<void>;
  onCreateEmploymentType: (name: string) => Promise<void>;
}

const JobCreateStep1: React.FC<JobCreateStep1Props> = ({
  form,
  jobTitles,
  jobTitlesLoading,
  jobTitleSearch,
  setJobTitleSearch,
  jobTitleDropdownOpen,
  setJobTitleDropdownOpen,
  departments,
  departmentsLoading,
  departmentSearch,
  setDepartmentSearch,
  departmentDropdownOpen,
  setDepartmentDropdownOpen,
  employmentTypes,
  employmentTypesLoading,
  employmentTypeSearch,
  setEmploymentTypeSearch,
  employmentTypeDropdownOpen,
  setEmploymentTypeDropdownOpen,
  workplaceTypes,
  jobTypes,
  onNext,
  onCreateJobTitle,
  onCreateDepartment,
  onCreateEmploymentType,
}) => {
  const salaryCurrency = form.watch('salaryCurrency') || 'USD';

  const canMoveToNext =
    form.watch('jobTitleId') &&
    form.watch('departmentId') &&
    form.watch('employmentTypeId') &&
    form.watch('workplaceType') &&
    form.watch('jobType');

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6 text-[15px]">
      <h2 className="text-lg font-semibold text-text mb-6">Basic Information</h2>

      <div className="space-y-6">
        {/* Job Title and Department Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComboboxWithCreate
            options={jobTitles}
            value={form.watch('jobTitleId') || ''}
            onChange={(value) => form.setValue('jobTitleId', value)}
            onCreateNew={onCreateJobTitle}
            placeholder="Search or add job title..."
            label="Job Title"
            loading={jobTitlesLoading}
            error={form.formState.errors.jobTitleId?.message}
            createLabel="Add job title"
          />

          <ComboboxWithCreate
            options={departments}
            value={form.watch('departmentId') || ''}
            onChange={(value) => form.setValue('departmentId', value)}
            onCreateNew={onCreateDepartment}
            placeholder="Search or add department..."
            label="Department"
            loading={departmentsLoading}
            error={form.formState.errors.departmentId?.message}
            createLabel="Add department"
          />
        </div>

        {/* Employment Type */}
        <div>
          <ComboboxWithCreate
            options={employmentTypes}
            value={form.watch('employmentTypeId') || ''}
            onChange={(value) => form.setValue('employmentTypeId', value)}
            onCreateNew={onCreateEmploymentType}
            placeholder="Search or add employment type..."
            label="Employment Type"
            loading={employmentTypesLoading}
            error={form.formState.errors.employmentTypeId?.message}
            createLabel="Add employment type"
          />
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range (Optional)
          </label>
          <div className="space-y-4">
            {/* Min and Max Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Salary
                </label>
                <input
                  id="salaryMin"
                  type="number"
                  placeholder="e.g., 50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  {...form.register('salaryMin', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Salary
                </label>
                <input
                  id="salaryMax"
                  type="number"
                  placeholder="e.g., 75000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  {...form.register('salaryMax', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Currency and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <CurrencySelect
                  value={salaryCurrency}
                  onValueChange={(value) => form.setValue('salaryCurrency', value)}
                  placeholder="Select currency"
                  label="Currency"
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="salaryPeriod"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Salary Period
                </label>
                <select
                  id="salaryPeriod"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  {...form.register('salaryPeriod')}
                >
                  <option value="yearly">Per Year</option>
                  <option value="monthly">Per Month</option>
                  <option value="weekly">Per Week</option>
                  <option value="daily">Per Day</option>
                  <option value="hourly">Per Hour</option>
                  <option value="delivery">Per Deliverable</option>
                </select>
              </div>
            </div>
          </div>
          {form.formState.errors.salaryMax && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.salaryMax.message}</p>
          )}
        </div>

        {/* Workplace Type and Job Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="workplaceType" className="block text-sm font-medium text-text mb-2">
              Workplace Type *
            </label>
            <select
              id="workplaceType"
              {...form.register('workplaceType', { required: true })}
              className="w-full px-4 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
            >
              <option value="">Select workplace type</option>
              {workplaceTypes.map((wt) => (
                <option key={wt.value} value={wt.value}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-text mb-2">
              Job Type *
            </label>
            <select
              id="jobType"
              {...form.register('jobType', { required: true })}
              className="w-full px-4 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
            >
              <option value="">Select job type</option>
              {jobTypes.map((jt) => (
                <option key={jt.value} value={jt.value}>
                  {jt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button
          type="button"
          onClick={onNext}
          className="min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canMoveToNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default JobCreateStep1;
