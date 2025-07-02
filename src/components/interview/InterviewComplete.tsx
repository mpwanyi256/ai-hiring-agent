'use client';

import Button from '@/components/ui/Button';
import { JobData } from '@/lib/services/jobsService';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface InterviewCompleteProps {
  job: JobData;
}

export default function InterviewComplete({ job }: InterviewCompleteProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">
            Interview Complete!
          </h1>
          <p className="text-muted-text text-lg">
            Thank you for taking the time to complete the interview for <strong>{job.title}</strong>.
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-text mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-primary" />
            What happens next?
          </h2>
          <div className="space-y-3 text-muted-text">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Our AI system will analyze your responses and generate a comprehensive evaluation.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>The hiring team will review your interview within 2-3 business days.</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>You&apos;ll be contacted directly if there&apos;s a mutual fit for the next steps.</p>
            </div>
          </div>
        </div>

        {/* Interview Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-light rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-semibold text-text">Position</h3>
            </div>
            <p className="text-muted-text">{job.title}</p>
          </div>

          <div className="bg-white border border-gray-light rounded-lg p-4">
            <div className="flex items-center mb-2">
              <BuildingOfficeIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-semibold text-text">Interview Format</h3>
            </div>
            <p className="text-muted-text capitalize">
              {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <EnvelopeIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Stay Connected</h3>
              <p className="text-blue-700 text-sm">
                Make sure to check your email regularly for updates. If you provided an email address during the interview, 
                we&apos;ll send you confirmation and any follow-up communications there.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="sm:w-auto w-full"
          >
            Close Window
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            className="sm:w-auto w-full"
          >
            Visit Our Website
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-light">
          <p className="text-sm text-muted-text">
            Questions about your interview? Feel free to reach out to our support team.
          </p>
        </div>
      </div>
    </div>
  );
} 