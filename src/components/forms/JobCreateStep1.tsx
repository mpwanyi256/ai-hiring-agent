import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Department,
  JobTitle,
  EmploymentType,
  WorkplaceType,
  JobType,
  JobFormData,
} from '@/types/jobs';
import { Button } from '@/components/ui/button';

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
}

const JobCreateStep1: React.FC<JobCreateStep1Props> = ({
  form,
  jobTitles,
  jobTitleSearch,
  setJobTitleSearch,
  jobTitleDropdownOpen,
  setJobTitleDropdownOpen,
  filteredJobTitles,
  departments,
  departmentSearch,
  setDepartmentSearch,
  departmentDropdownOpen,
  setDepartmentDropdownOpen,
  filteredDepartments,
  employmentTypes,
  employmentTypeSearch,
  setEmploymentTypeSearch,
  employmentTypeDropdownOpen,
  setEmploymentTypeDropdownOpen,
  filteredEmploymentTypes,
  workplaceTypes,
  jobTypes,
  onNext,
}) => {
  const canMoveToNext =
    form.watch('jobTitleId') &&
    form.watch('departmentId') &&
    form.watch('employmentTypeId') &&
    form.watch('workplaceType') &&
    form.watch('jobType');

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6 text-[15px]">
      <h2 className="text-lg font-semibold text-text mb-6">Basic Job Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Job Title */}
        <div className="relative" data-dropdown="job-title">
          <label htmlFor="jobTitleId" className="block text-sm font-medium text-text mb-2">
            Job Title *
          </label>
          <input
            id="jobTitleId"
            type="text"
            autoComplete="off"
            value={jobTitleSearch}
            onChange={(e) => setJobTitleSearch(e.target.value)}
            onFocus={() => setJobTitleDropdownOpen(true)}
            placeholder="Search job titles..."
            className="w-full px-4 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
          />
          {jobTitleDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredJobTitles.length > 0 ? (
                filteredJobTitles.map((jt) => (
                  <button
                    key={jt.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-primary/10 text-text"
                    onClick={() => {
                      form.setValue('jobTitleId', jt.id);
                      setJobTitleSearch(jt.name);
                      setJobTitleDropdownOpen(false);
                    }}
                  >
                    {jt.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-muted-text text-sm text-center">
                  No job titles found
                </div>
              )}
            </div>
          )}
          <input
            type="hidden"
            {...form.register('jobTitleId', { required: true })}
            value={jobTitles.find((jt) => jt.name === jobTitleSearch)?.id || ''}
          />
        </div>
        {/* Department */}
        <div className="relative" data-dropdown="department">
          <label htmlFor="departmentId" className="block text-sm font-medium text-text mb-2">
            Department *
          </label>
          <input
            id="departmentId"
            type="text"
            autoComplete="off"
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            onFocus={() => setDepartmentDropdownOpen(true)}
            placeholder="Search departments..."
            className="w-full px-4 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
          />
          {departmentDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-primary/10 text-text"
                    onClick={() => {
                      form.setValue('departmentId', d.id);
                      setDepartmentSearch(d.name);
                      setDepartmentDropdownOpen(false);
                    }}
                  >
                    {d.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-muted-text text-sm text-center">
                  No departments found
                </div>
              )}
            </div>
          )}
          <input
            type="hidden"
            {...form.register('departmentId', { required: true })}
            value={departments.find((d) => d.name === departmentSearch)?.id || ''}
          />
        </div>
        {/* Employment Type */}
        <div className="relative" data-dropdown="employment-type">
          <label htmlFor="employmentTypeId" className="block text-sm font-medium text-text mb-2">
            Employment Type *
          </label>
          <input
            id="employmentTypeId"
            type="text"
            autoComplete="off"
            value={employmentTypeSearch}
            onChange={(e) => setEmploymentTypeSearch(e.target.value)}
            onFocus={() => setEmploymentTypeDropdownOpen(true)}
            placeholder="Search employment types..."
            className="w-full px-4 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
          />
          {employmentTypeDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredEmploymentTypes.length > 0 ? (
                filteredEmploymentTypes.map((et) => (
                  <button
                    key={et.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-primary/10 text-text"
                    onClick={() => {
                      form.setValue('employmentTypeId', et.id);
                      setEmploymentTypeSearch(et.name);
                      setEmploymentTypeDropdownOpen(false);
                    }}
                  >
                    {et.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-muted-text text-sm text-center">
                  No employment types found
                </div>
              )}
            </div>
          )}
          <input
            type="hidden"
            {...form.register('employmentTypeId', { required: true })}
            value={employmentTypes.find((et) => et.name === employmentTypeSearch)?.id || ''}
          />
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
