import { useAppSelector } from '@/store';
import { loadedInterview } from '@/store/interview/interviewSelectors';
import { AppJobsFields } from '@/types';

export default function JobSidebar() {
  const job = useAppSelector(loadedInterview);
  if (!job) return null;

  return (
    <div className="p-6">
      {/* Job Title */}
      <div className="text-2xl font-semibold text-gray-900 mb-6 leading-tight">{job.title}</div>
      {/* Job Details */}
      <div className="mb-6 text-sm text-gray-700 space-y-3">
        <div>
          <span className="font-medium text-gray-500">Employment Type:</span> {job.jobType}
        </div>
        <div>
          <span className="font-medium text-gray-500">Duration:</span> 5-10 minutes
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
