'use client';

import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { JobData } from '@/lib/services/jobsService';
import { InterviewEvaluation } from '@/types/interview';

interface ExistingEvaluationDisplayProps {
  evaluation: InterviewEvaluation;
  job: JobData;
  onProceedToInterview: () => void;
  onRetryUpload?: () => void; // Add retry option
}

export default function ExistingEvaluationDisplay({
  evaluation,
  job,
  onProceedToInterview,
  onRetryUpload,
}: ExistingEvaluationDisplayProps) {
  const resumeScore = evaluation.resumeScore || evaluation.score || 0;
  const passesThreshold = resumeScore >= 50; // Changed threshold to 50
  const isNewEvaluation =
    evaluation.createdAt &&
    new Date().getTime() - new Date(evaluation.createdAt).getTime() < 5 * 60 * 1000; // Within 5 minutes

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 border border-gray-200 rounded-lg p-8 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              passesThreshold ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {passesThreshold ? (
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">
            {isNewEvaluation ? 'Resume Evaluation Complete' : 'Resume Already Evaluated'}
          </h1>
          <p className="text-muted-text">
            {isNewEvaluation
              ? `Your resume has been evaluated for the ${job.title} position`
              : `We found an existing resume evaluation for the ${job.title} position`}
          </p>
        </div>

        {/* Evaluation Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold text-text">
              {isNewEvaluation ? 'Evaluation Results' : 'Previous Evaluation'}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-text">Resume Score:</span>
              <span
                className={`font-semibold ${passesThreshold ? 'text-green-600' : 'text-red-600'}`}
              >
                {resumeScore}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-text">Status:</span>
              <span
                className={`font-medium px-2 py-1 rounded-full text-xs ${
                  passesThreshold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {passesThreshold ? 'Passed' : 'Below Threshold (50% required)'}
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
                {new Date(evaluation.createdAt).toLocaleDateString()} at{' '}
                {new Date(evaluation.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {evaluation.resumeSummary && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-text mb-2">Summary:</h4>
              <p className="text-sm text-muted-text">{evaluation.resumeSummary}</p>
            </div>
          )}

          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">Key Strengths:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-green-600 rounded-full mr-2"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.redFlags && evaluation.redFlags.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">Areas for Improvement:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {evaluation.redFlags.map((flag, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full mr-2"></span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {passesThreshold ? (
            <>
              <Button onClick={onProceedToInterview} className="w-full sm:w-auto">
                Continue to Interview Questions
              </Button>

              <p className="text-sm text-muted-text">
                Great! Your resume meets our requirements. You can now proceed to the interview
                questions.
              </p>
            </>
          ) : (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium mb-2">
                  Resume Score Below Threshold
                </p>
                <p className="text-red-700 text-sm">
                  Your resume score is below the 50% threshold required to proceed. Consider
                  updating your resume with more relevant experience and skills for this position,
                  then upload it again.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {onRetryUpload && (
                  <Button onClick={onRetryUpload} variant="outline" className="w-full sm:w-auto">
                    Upload New Resume
                  </Button>
                )}

                <Button
                  onClick={() => window.history.back()}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Go Back
                </Button>
              </div>

              <p className="text-sm text-muted-text">
                You can upload a new or updated resume to try again.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
