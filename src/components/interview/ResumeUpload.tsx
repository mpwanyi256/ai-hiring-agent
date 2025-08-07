'use client';

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useResumeEvaluation } from '@/hooks/useResumeEvaluation';
import FileUploadArea from './FileUploadArea';
import ErrorDisplay from './ErrorDisplay';
import UploadProgress from './UploadProgress';
import ExistingEvaluationDisplay from './ExistingEvaluationDisplay';
import { loadedInterview, selectCandidate } from '@/store/interview/interviewSelectors';
import { useAppSelector } from '@/store';
import { useEffect } from 'react';

interface ResumeUploadProps {
  jobToken: string;
  onEvaluationCompleted?: () => void;
}

export default function ResumeUpload({ jobToken, onEvaluationCompleted }: ResumeUploadProps) {
  const job = useAppSelector(loadedInterview);
  const candidateInfo = useAppSelector(selectCandidate);

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
    setSelectedFile,
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

  // Handle evaluation completion and step transition
  useEffect(() => {
    // When a new evaluation is completed, notify parent to re-check
    if (evaluation && !existingEvaluation) {
      // Handle different evaluation types - some have resumeScore, others have score
      const score = (evaluation as any)?.resumeScore ?? (evaluation as any)?.score;
      if (score !== undefined && score >= 50) {
        // Notify parent component to re-check evaluation status
        setTimeout(() => {
          onEvaluationCompleted?.();
        }, 2000); // Give user time to see the result
      }
    }
  }, [evaluation, existingEvaluation, onEvaluationCompleted]);

  // Remove the old useEffects that were causing recursion
  // The evaluation completion is now handled by the single useEffect above

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
      const resumeScore =
        (displayEvaluation as any)?.resumeScore || (displayEvaluation as any)?.score || 0;
      const passesThreshold = resumeScore >= 50;

      // If evaluation failed, show the upload interface instead of the evaluation display
      if (!passesThreshold && !evaluation) {
        // Show upload interface with existing evaluation info
        // This allows re-upload for failed evaluations
      } else {
        return (
          <ExistingEvaluationDisplay
            evaluation={displayEvaluation}
            job={job}
            onProceedToInterview={proceedToInterview}
            onRetryUpload={() => {
              // Reset evaluation states to allow new upload
              clearError();
              setSelectedFile(null);
            }}
          />
        );
      }
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">
              {existingEvaluation &&
              ((existingEvaluation as any)?.resumeScore ||
                (existingEvaluation as any)?.score ||
                0) < 50
                ? 'Upload a New Resume'
                : 'Upload Your Resume'}
            </h1>
            <p className="text-muted-text">
              {existingEvaluation &&
              ((existingEvaluation as any)?.resumeScore ||
                (existingEvaluation as any)?.score ||
                0) < 50
                ? `Your previous resume scored ${Math.round((existingEvaluation as any)?.resumeScore || (existingEvaluation as any)?.score || 0)}%. Upload an updated resume to try again.`
                : `Upload your resume for evaluation against the ${job.title} position requirements.`}
            </p>
          </div>

          {/* Show previous evaluation info if it failed */}
          {existingEvaluation &&
            ((existingEvaluation as any)?.resumeScore || (existingEvaluation as any)?.score || 0) <
              50 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Previous Evaluation</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-medium">
                      {Math.round(
                        (existingEvaluation as any)?.resumeScore ||
                          (existingEvaluation as any)?.score ||
                          0,
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required:</span>
                    <span className="font-medium">50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="font-medium">
                      {(existingEvaluation as any)?.resumeFilename || 'Resume.pdf'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  Consider updating your resume with more relevant experience and skills before
                  re-uploading.
                </p>
              </div>
            )}

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
    </div>
  );
}
