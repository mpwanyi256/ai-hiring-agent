'use client';

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useResumeEvaluation } from '@/hooks/useResumeEvaluation';
import FileUploadArea from './FileUploadArea';
import ErrorDisplay from './ErrorDisplay';
import UploadProgress from './UploadProgress';
import ExistingEvaluationDisplay from './ExistingEvaluationDisplay';
import { CandidateResumeEvaluation } from '../resumeStep/CandidateResumeEvaluation';
import { loadedInterview, selectCandidate } from '@/store/interview/interviewSelectors';
import { useAppSelector } from '@/store';

interface ResumeUploadProps {
  jobToken: string;
}

export default function ResumeUpload({ 
  jobToken
}: ResumeUploadProps) {
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
    hasExistingEvaluation,
    canProceed
  } = useResumeEvaluation({
    jobToken,
    candidateInfo,
    jobId: job?.id || ''
  });

  if (!job) {
    return <div>Loading...</div>;
  }

  // Show existing evaluation if found
  if (hasExistingEvaluation && existingEvaluation) {
    return (
      <ExistingEvaluationDisplay
        evaluation={existingEvaluation}
        job={job}
        onProceedToInterview={proceedToInterview}
      />
    );
  }

  // Show evaluation results if we have a new evaluation
  if (evaluation) {
    return <CandidateResumeEvaluation evaluation={evaluation} resumeContent={selectedFile?.name || ''} job={job} />
  }

  // Main upload interface
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        </div>

        {/* Error Display */}
        <ErrorDisplay
          error={error}
          validationError={validationError}
          evaluation={evaluation}
          onDismiss={clearError}
        />

        {/* Upload Progress */}
        <UploadProgress
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />

        {/* File Upload Area */}
        <FileUploadArea
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          isLoading={isLoading}
          disabled={isLoading}
        />

        {/* Upload Button */}
        <div className="text-center">
          <Button
            onClick={uploadAndEvaluateResume}
            disabled={!selectedFile || isLoading || !!validationError}
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Evaluating Resume...' : 'Evaluate Resume'}
          </Button>
          {selectedFile && !validationError && (
            <p className="text-sm text-muted-text mt-4">
              Processing time varies by document size and complexity
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 