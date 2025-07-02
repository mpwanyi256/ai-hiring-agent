'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { JobData } from '@/lib/services/jobsService';
import { 
  BriefcaseIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  PlayIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface InterviewPageProps {
  params: {
    token: string;
  };
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const router = useRouter();
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Fetch job details by token
  useEffect(() => {
    const fetchJob = async () => {
      if (!params.token) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/jobs/interview/${params.token}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Interview not found');
        }

        // Check if job is active
        if (!data.job.isActive) {
          throw new Error('This interview is no longer accepting candidates');
        }

        setJob(data.job);
      } catch (err) {
        console.error('Error fetching interview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [params.token]);

  const startInterview = () => {
    setHasStarted(true);
    // TODO: Navigate to actual interview flow
    // For now, we'll show a placeholder
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-muted-text">Loading interview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-accent-red mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">Interview Unavailable</h1>
          <p className="text-muted-text mb-6">
            {error || 'The interview you are looking for is not available or has expired.'}
          </p>
          <p className="text-sm text-muted-text">
            Please check the link or contact the employer for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (hasStarted) {
    // TODO: Replace with actual interview component
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <PlayIcon className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-4">Interview Starting Soon</h1>
          <p className="text-muted-text mb-6">
            The AI interview system is being prepared. This feature will be available in the next update.
          </p>
          <Button onClick={() => setHasStarted(false)} variant="outline">
            Back to Job Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">AI Interview</h1>
              <p className="text-sm text-muted-text">Powered by Advanced AI Technology</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text mb-2">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text">
                <div className="flex items-center space-x-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>Company Position</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>
                    {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckBadgeIcon className="w-4 h-4" />
                  <span>15-30 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          {job.fields?.jobDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text mb-3">About This Role</h3>
              <div 
                className="prose prose-sm max-w-none text-text"
                dangerouslySetInnerHTML={{ __html: job.fields.jobDescription }}
              />
            </div>
          )}

          {/* Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Skills & Experience */}
            {(job.fields?.skills || job.fields?.experienceLevel) && (
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Requirements</h3>
                
                {job.fields?.experienceLevel && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-muted-text mb-2">Experience Level</h4>
                    <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                )}
                
                {job.fields?.skills && job.fields.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-text mb-2">Skills</h4>
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
              </div>
            )}

            {/* Traits */}
            {job.fields?.traits && job.fields.traits.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Desired Qualities</h3>
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
          </div>

          {/* Custom Fields */}
          {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(job.fields.customFields).map(([key, field]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-text mb-1">{key}</h4>
                    <p className="text-sm text-muted-text">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interview Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-text mb-4">Interview Process</h3>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">What to Expect</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI-powered interview questions tailored to this role</li>
                  <li>• {job.interviewFormat === 'text' ? 'Text-based responses' : 'Video responses'} to interview questions</li>
                  <li>• Estimated duration: 15-30 minutes</li>
                  <li>• Automatic evaluation and scoring</li>
                  <li>• Results shared with the employer</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-text">Format:</span>
              <span className="ml-2 text-muted-text">
                {job.interviewFormat === 'text' ? 'Text-based Q&A' : 'Async Video Responses'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-text">Duration:</span>
              <span className="ml-2 text-muted-text">15-30 minutes</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-text">Questions:</span>
              <span className="ml-2 text-muted-text">AI-generated based on role</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-text">Evaluation:</span>
              <span className="ml-2 text-muted-text">Automated scoring</span>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Before You Start</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Find a quiet environment without distractions</li>
                  {job.interviewFormat === 'video' && (
                    <>
                      <li>• Check your camera and microphone are working</li>
                      <li>• Good lighting on your face is recommended</li>
                    </>
                  )}
                  <li>• You can take your time to think before responding</li>
                  <li>• Be authentic and honest in your responses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h3 className="text-xl font-bold text-text mb-2">Ready to Begin?</h3>
          <p className="text-muted-text mb-6">
            When you're ready, click the button below to start your AI interview for the {job.title} position.
          </p>
          
          <Button 
            onClick={startInterview}
            size="lg"
            className="px-8 py-3 text-lg font-semibold"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Interview
          </Button>
          
          <p className="text-xs text-muted-text mt-4">
            By starting this interview, you consent to the automated evaluation of your responses.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-light mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-text">
            Powered by AI Hiring Agent • Advanced Interview Technology
          </p>
        </div>
      </div>
    </div>
  );
} 