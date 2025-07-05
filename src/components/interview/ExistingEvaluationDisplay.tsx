'use client';

import { DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { JobData } from '@/lib/services/jobsService';
import { InterviewEvaluation } from '@/types/interview';

interface ExistingEvaluationDisplayProps {
  evaluation: InterviewEvaluation;
  job: JobData;
  onProceedToInterview: () => void;
}

export default function ExistingEvaluationDisplay({
  evaluation,
  job,
  onProceedToInterview
}: ExistingEvaluationDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 border border-gray-200 rounded-lg p-8 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-100">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Resume Already Evaluated</h1>
          <p className="text-muted-text">
            We found an existing resume evaluation for the {job.title} position
          </p>
        </div>

        {/* Evaluation Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-text">Previous Evaluation</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-text">Resume Score:</span>
              <span className="font-semibold text-text">
                {evaluation.resumeScore || evaluation.score}/100
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-text">File:</span>
              <span className="font-medium text-text">
                {evaluation.resumeFilename || 'Resume.pdf'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-text">Evaluated:</span>
              <span className="font-medium text-text">
                {new Date(evaluation.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {evaluation.resumeSummary && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-text mb-2">Summary:</h4>
              <p className="text-sm text-muted-text line-clamp-3">
                {evaluation.resumeSummary}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={onProceedToInterview}
            className="w-full sm:w-auto"
          >
            Continue to Interview Questions
          </Button>
          
          <p className="text-sm text-muted-text">
            You can proceed directly to the interview questions since your resume has already been evaluated.
          </p>
        </div>
      </div>
    </div>
  );
} 