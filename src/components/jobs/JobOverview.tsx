'use client';

import { JobData } from '@/lib/services/jobsService';
import { 
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface JobOverviewProps {
  job: JobData;
}

export default function JobOverview({ job }: JobOverviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Job Info Summary */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Job Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-muted-text" />
            <span className="text-muted-text">Created:</span>
            <span className="text-text font-medium">{formatDate(job.createdAt)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-muted-text" />
            <span className="text-muted-text">Interview Format:</span>
            <span className="text-text font-medium capitalize">
              {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <BriefcaseIcon className="w-4 h-4 text-muted-text" />
            <span className="text-muted-text">Status:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              job.status === 'draft' 
                ? 'bg-gray-100 text-gray-600'
                : job.status === 'interviewing'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-green-100 text-green-600'
            }`}>
              {job.status === 'draft' ? 'Draft' : job.status === 'interviewing' ? 'Interviewing' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Job Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills & Experience */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Requirements</h2>
          
          {job.fields?.experienceLevel && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-text mb-2">Experience Level</h3>
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          )}
          
          {job.fields?.skills && job.fields.skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-text mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.fields.skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {job.fields?.traits && job.fields.traits.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-text mb-2">Desired Traits</h3>
              <div className="flex flex-wrap gap-2">
                {job.fields.traits.map((trait, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-accent-blue/10 text-accent-blue rounded-full text-sm font-medium"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {!job.fields?.skills && !job.fields?.traits && !job.fields?.experienceLevel && (
            <p className="text-muted-text text-sm">No specific requirements specified.</p>
          )}
        </div>

        {/* Custom Fields */}
        <div className="bg-white rounded-lg border border-gray-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Additional Information</h2>
          
          {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(job.fields.customFields).map(([key, field]) => (
                <div key={key}>
                  <h3 className="text-sm font-medium text-text mb-1">{key}</h3>
                  <p className="text-sm text-muted-text">
                    {field.value} <span className="text-xs">({field.inputType})</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-text text-sm">No additional information specified.</p>
          )}
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Job Description</h2>
        
        {job.fields?.jobDescription ? (
          <div 
            className="prose prose-sm max-w-none text-text"
            dangerouslySetInnerHTML={{ __html: job.fields.jobDescription }}
          />
        ) : (
          <p className="text-muted-text">No job description provided.</p>
        )}
      </div>

      {/* Interview Process */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Interview Process</h2>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-text">AI-Powered Interview</h3>
              <p className="text-sm text-muted-text">
                Candidates will participate in an automated {job.interviewFormat === 'text' ? 'text-based' : 'video'} interview
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-text">Format:</span>
              <span className="ml-2 text-text">
                {job.interviewFormat === 'text' ? 'Text-based Q&A' : 'Async Video Responses'}
              </span>
            </div>
            <div>
              <span className="font-medium text-muted-text">Duration:</span>
              <span className="ml-2 text-text">15-30 minutes</span>
            </div>
            <div>
              <span className="font-medium text-muted-text">Questions:</span>
              <span className="ml-2 text-text">AI-generated based on job requirements</span>
            </div>
            <div>
              <span className="font-medium text-muted-text">Evaluation:</span>
              <span className="ml-2 text-text">Automated scoring and summary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 