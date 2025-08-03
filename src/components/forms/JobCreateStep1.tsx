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
  filteredJobTitles: JobTitle[];
  departments: Department[];
  departmentsLoading: boolean;
  departmentSearch: string;
  setDepartmentSearch: (v: string) => void;
  departmentDropdownOpen: boolean;
  setDepartmentDropdownOpen: (v: boolean) => void;
  filteredDepartments: Department[];
  employmentTypes: EmploymentType[];
  employmentTypesLoading: boolean;
  employmentTypeSearch: string;
  setEmploymentTypeSearch: (v: string) => void;
  employmentTypeDropdownOpen: boolean;
  setEmploymentTypeDropdownOpen: (v: boolean) => void;
  filteredEmploymentTypes: EmploymentType[];
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Title */}
        <ComboboxWithCreate
          options={jobTitles}
          value={form.watch('jobTitleId') || ''}
          onChange={(value) => form.setValue('jobTitleId', value)}
          onCreateNew={onCreateJobTitle}
          placeholder="Search or add job title..."
          label="Job Title"
          loading={jobTitlesLoading}
          error={form.formState.errors.jobTitleId?.message}
          searchValue={jobTitleSearch}
          onSearchChange={setJobTitleSearch}
          dropdownOpen={jobTitleDropdownOpen}
          onDropdownToggle={setJobTitleDropdownOpen}
          dataDropdown="job-title"
          createLabel="Add job title"
        />

        {/* Department */}
        <ComboboxWithCreate
          options={departments}
          value={form.watch('departmentId') || ''}
          onChange={(value) => form.setValue('departmentId', value)}
          onCreateNew={onCreateDepartment}
          placeholder="Search or add department..."
          label="Department"
          loading={departmentsLoading}
          error={form.formState.errors.departmentId?.message}
          searchValue={departmentSearch}
          onSearchChange={setDepartmentSearch}
          dropdownOpen={departmentDropdownOpen}
          onDropdownToggle={setDepartmentDropdownOpen}
          dataDropdown="department"
          createLabel="Add department"
        />

        {/* Employment Type */}
        <ComboboxWithCreate
          options={employmentTypes}
          value={form.watch('employmentTypeId') || ''}
          onChange={(value) => form.setValue('employmentTypeId', value)}
          onCreateNew={onCreateEmploymentType}
          placeholder="Search or add employment type..."
          label="Employment Type"
          loading={employmentTypesLoading}
          error={form.formState.errors.employmentTypeId?.message}
          searchValue={employmentTypeSearch}
          onSearchChange={setEmploymentTypeSearch}
          dropdownOpen={employmentTypeDropdownOpen}
          onDropdownToggle={setEmploymentTypeDropdownOpen}
          dataDropdown="employment-type"
          createLabel="Add employment type"
        />

        {/* Salary Range */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Range (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <input
                type="number"
                placeholder="Min salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                {...form.register('salaryMin', { valueAsNumber: true })}
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                {...form.register('salaryMax', { valueAsNumber: true })}
              />
            </div>
            <div>
              <CurrencySelect
                value={salaryCurrency}
                onValueChange={(value) => form.setValue('salaryCurrency', value)}
                placeholder="Currency"
                showLabel={false}
                className="w-full"
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                {...form.register('salaryPeriod')}
              >
                <option value="yearly">Per Year</option>
                <option value="monthly">Per Month</option>
                <option value="weekly">Per Week</option>
                <option value="daily">Per Day</option>
                <option value="hourly">Per Hour</option>
              </select>
            </div>
          </div>
          {form.formState.errors.salaryMax && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.salaryMax.message}</p>
          )}
        </div>
        {/* Workplace Type */}
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
        {/* Job Type */}
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
