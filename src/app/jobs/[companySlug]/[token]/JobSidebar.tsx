import { useAppSelector } from '@/store';
import { loadedInterview } from '@/store/interview/interviewSelectors';
import { AppJobsFields } from '@/types';
import {
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function JobSidebar() {
  const job = useAppSelector(loadedInterview);
  if (!job) return null;

  // Format salary range display
  const formatSalaryRange = () => {
    if (!job.salaryMin && !job.salaryMax) return null;

    const currency = job.salaryCurrency || 'USD';
    const period = job.salaryPeriod || 'yearly';

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    if (job.salaryMin && job.salaryMax) {
      return `${formatAmount(job.salaryMin)} - ${formatAmount(job.salaryMax)} ${period}`;
    } else if (job.salaryMin) {
      return `From ${formatAmount(job.salaryMin)} ${period}`;
    } else if (job.salaryMax) {
      return `Up to ${formatAmount(job.salaryMax)} ${period}`;
    }

    return null;
  };

  const salaryRange = formatSalaryRange();

  return (
    <div className="p-6">
      {/* Job Title */}
      <div className="text-2xl font-semibold text-gray-900 mb-6 leading-tight">{job.title}</div>

      {/* Company Info */}
      {job.companyName && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {job.companyLogo && (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{job.companyName}</h3>
              {job.departmentName && (
                <p className="text-sm text-gray-600">{job.departmentName} Department</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Details */}
      <div className="mb-6 text-sm text-gray-700 space-y-4">
        {/* Employment Type & Workplace */}
        <div className="space-y-3">
          {job.employmentTypeName && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-500">Employment Type:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {job.employmentTypeName}
              </span>
            </div>
          )}

          {job.workplaceType && (
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-500">Work Style:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                {job.workplaceType.replace('_', ' ')}
              </span>
            </div>
          )}

          {job.location && (
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-500">Location:</span>
              <span>{job.location}</span>
            </div>
          )}

          {salaryRange && (
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-500">Salary:</span>
              <span className="font-semibold text-green-600">{salaryRange}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-500">Application Time:</span>
            <span>5-10 minutes</span>
          </div>
        </div>
      </div>

      {/* Required Skills */}
      {job.fields?.skills && job.fields.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.fields.skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Qualities */}
      {job.fields?.traits && job.fields.traits.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Key Qualities</h3>
          <div className="flex flex-wrap gap-2">
            {job.fields.traits.map((trait: string, index: number) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience Level */}
      {job.fields?.experienceLevel && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Experience Level</h3>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
            {job.fields.experienceLevel}
          </span>
        </div>
      )}

      {/* Custom Fields */}
      {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Additional Requirements</h3>
          <div className="space-y-2">
            {Object.entries(job.fields.customFields).map(([key, field]: AppJobsFields) => (
              <div key={key} className="text-sm">
                <span className="font-medium text-gray-900">{key}:</span>{' '}
                <span className="text-gray-700">{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
