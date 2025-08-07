'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { evaluateResume, getResumeEvaluation } from '@/store/evaluation/evaluationThunks';
import { clearResumeError } from '@/store/evaluation/evaluationSlice';
import {
  selectCurrentResumeEvaluation,
  selectResumeEvaluationLoading,
  selectResumeEvaluationError,
  selectIsUploading,
  selectUploadProgress,
} from '@/store/evaluation/evaluationSelectors';
import { AppDispatch } from '@/store';
import { apiError } from '@/lib/notification';

interface UseResumeEvaluationProps {
  jobToken: string;
  candidateInfo: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  jobId: string;
}

export function useResumeEvaluation({ jobToken, candidateInfo, jobId }: UseResumeEvaluationProps) {
  const dispatch = useDispatch<AppDispatch>();
  const evaluation = useSelector(selectCurrentResumeEvaluation);
  const isLoading = useSelector(selectResumeEvaluationLoading);
  const error = useSelector(selectResumeEvaluationError);
  const isUploading = useSelector(selectIsUploading);
  const uploadProgress = useSelector(selectUploadProgress);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);

  // Check for existing evaluation on mount
  useEffect(() => {
    const checkExistingEvaluation = async () => {
      if (!candidateInfo?.id || !jobId) return;

      setIsCheckingExisting(true);
      try {
        const result = await dispatch(
          getResumeEvaluation({
            candidateId: candidateInfo.id,
            jobId,
          }),
        ).unwrap();

        if (result) {
          setExistingEvaluation(result);
        } else {
          setExistingEvaluation(null);
        }
      } finally {
        setIsCheckingExisting(false);
      }
    };

    if (candidateInfo?.id && jobId) {
      checkExistingEvaluation();
    }
  }, [candidateInfo?.id, jobId, dispatch]);

  const handleFileSelect = (file: File) => {
    // Allow file selection even if there's an existing evaluation (for re-upload)
    // Only prevent if the existing evaluation passed the threshold
    if (existingEvaluation && existingEvaluation.resumeScore >= 50) {
      setValidationError(
        'You already have a passing resume evaluation. You can proceed to the interview.',
      );
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
  };

  const uploadAndEvaluateResume = async () => {
    if (!selectedFile || !candidateInfo) return;

    // Allow re-upload if existing evaluation didn't pass threshold
    if (existingEvaluation && existingEvaluation.resumeScore >= 50) {
      setValidationError(
        'You already have a passing resume evaluation. You can proceed to the interview.',
      );
      return;
    }

    try {
      await dispatch(
        evaluateResume({
          resumeFile: selectedFile,
          jobToken,
          candidateInfo: {
            id: candidateInfo.id,
            email: candidateInfo.email,
            firstName: candidateInfo.firstName,
            lastName: candidateInfo.lastName,
          },
        }),
      );
    } catch (err) {
      apiError(err as string);
    }
  };

  const clearError = () => {
    dispatch(clearResumeError());
    setValidationError(null);
  };

  const proceedToInterview = () => {
    // With centralized step management, we don't need to manually set the step
    // The JobApplicationTab will automatically detect the passing evaluation
    // and transition to the correct step.
    // This function can be used to trigger a refresh if needed
    console.log('Proceeding to interview - step will be managed centrally');
  };

  const handleEvaluationComplete = (evaluation: any) => {
    // Evaluation completion is now handled by centralized step management
    // The JobApplicationTab will automatically detect the evaluation result
    // and transition to the appropriate step
    console.log('Evaluation complete - step will be managed centrally', evaluation);
  };

  return {
    // State
    selectedFile,
    evaluation,
    isLoading: isLoading || isCheckingExisting,
    error,
    isUploading,
    uploadProgress,
    validationError,
    existingEvaluation,
    isCheckingExisting,

    // Actions
    handleFileSelect,
    uploadAndEvaluateResume,
    clearError,
    proceedToInterview,
    handleEvaluationComplete,
    setSelectedFile, // Expose setSelectedFile for resetting

    // Computed
    hasExistingEvaluation: !!existingEvaluation,
    canProceed: !!existingEvaluation || !!evaluation,
  };
}
