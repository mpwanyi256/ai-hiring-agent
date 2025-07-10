'use client';

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useResumeEvaluation } from '@/hooks/useResumeEvaluation';
import FileUploadArea from './FileUploadArea';
import ErrorDisplay from './ErrorDisplay';
import UploadProgress from './UploadProgress';
import ExistingEvaluationDisplay from './ExistingEvaluationDisplay';
import { loadedInterview, selectCandidate } from '@/store/interview/interviewSelectors';
import { useAppSelector, useAppDispatch } from '@/store';
import { setInterviewStep } from '@/store/interview/interviewSlice';
import { useEffect } from 'react';

interface ResumeUploadProps {
  jobToken: string;
}

export default function ResumeUpload({ jobToken }: ResumeUploadProps) {
  const job = useAppSelector(loadedInterview);
  const candidateInfo = useAppSelector(selectCandidate);
  const dispatch = useAppDispatch();

  const {
    selectedFile,
    evaluation,
    isLoading,
    error,
    isUploading,
    uploadProgress,
    validationError,
    existingEvaluation,
    isCheckingExisting,
    handleFileSelect,
    uploadAndEvaluateResume,
    clearError,
    proceedToInterview,
    handleEvaluationComplete,
    hasExistingEvaluation,
    canProceed,
  } = useResumeEvaluation({
    jobToken,
    candidateInfo: {
      id: candidateInfo?.id || '',
      email: candidateInfo?.email || '',
      firstName: candidateInfo?.firstName || '',
      lastName: candidateInfo?.lastName || '',
    },
    jobId: job?.id || '',
  });

  // Handle evaluation completion
  useEffect(() => {
    if (evaluation) {
      handleEvaluationComplete(evaluation);
    }
  }, [evaluation, handleEvaluationComplete]);

  // Handle evaluation result and step transition
  useEffect(() => {
    const displayEvaluation = evaluation || (existingEvaluation ? existingEvaluation : undefined);
    if (displayEvaluation && typeof displayEvaluation === 'object') {
      const score =
        typeof displayEvaluation.resumeScore === 'number'
          ? displayEvaluation.resumeScore
          : displayEvaluation.score;
      if (typeof score === 'number') {
        if (score >= 50) {
          dispatch(setInterviewStep(4)); // Interview step
        } else {
          dispatch(setInterviewStep(5)); // Results/failure step
        }
      }
    }
  }, [evaluation, existingEvaluation, dispatch]);

  // Debug logging
  useEffect(() => {
    // The old proceedToInterview/canProceed logic is now handled by the new useEffect
  }, [
    candidateInfo,
    job,
    isCheckingExisting,
    existingEvaluation,
    evaluation,
    hasExistingEvaluation,
    canProceed,
    proceedToInterview,
  ]);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking for existing evaluation
  if (isCheckingExisting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-text mb-2">Checking Resume Status</h2>
          <p className="text-muted-text">Checking if you have an existing resume evaluation...</p>
        </div>
      </div>
    );
  }

  // Show existing evaluation results if we have any evaluation (new or existing)
  if (evaluation || existingEvaluation) {
    const displayEvaluation = evaluation || (existingEvaluation ? existingEvaluation : undefined);
    if (displayEvaluation) {
      return (
        <ExistingEvaluationDisplay
          evaluation={displayEvaluation}
          job={job}
          onProceedToInterview={proceedToInterview}
        />
      );
    }
  }

  // Show message if no candidate info is available
  if (!candidateInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Missing Information</h2>
          <p className="text-muted-text mb-4">
            Please complete the previous step to provide your information before uploading a resume.
          </p>
          <Button onClick={() => window.history.back()} variant="outline" className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Main upload interface
  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto px-4 border border-gray-200 rounded-lg p-8 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-primary/10">
            <DocumentTextIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Upload Your Resume</h1>
          <p className="text-muted-text">
            Upload your resume to get an AI evaluation for the {job.title} position
          </p>
          <p className="text-sm text-muted-text mt-2">
            Hi {candidateInfo.firstName}, let&apos;s evaluate your resume against the job
            requirements.
          </p>
        </div>

        {/* Error Display */}
        <ErrorDisplay
          error={error}
          validationError={validationError}
          evaluation={evaluation}
          onDismiss={clearError}
        />

        {/* Upload Progress */}
        <UploadProgress isUploading={isUploading} uploadProgress={uploadProgress} />

        {/* File Upload Area */}
        <FileUploadArea
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          isLoading={isLoading}
          disabled={isLoading || isUploading}
        />

        {/* Upload Button */}
        <div className="text-center">
          <Button
            onClick={uploadAndEvaluateResume}
            disabled={!selectedFile || isLoading || isUploading || !!validationError}
            isLoading={isLoading || isUploading}
            className="w-full sm:w-auto"
          >
            {isLoading || isUploading ? 'Evaluating Resume...' : 'Evaluate Resume'}
          </Button>
          {selectedFile && !validationError && (
            <p className="text-sm text-muted-text mt-4">
              Processing time varies by document size and complexity
            </p>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-blue-600 mt-0.5">💡</div>
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Resume Evaluation Process:</p>
              <ul className="text-xs space-y-1">
                <li>• Your resume will be analyzed against the job requirements</li>
                <li>• You need a score of 60% or higher to proceed to interview questions</li>
                <li>• The evaluation takes about 30-60 seconds to complete</li>
                <li>• You can only upload one resume per application</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
