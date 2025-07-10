'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { evaluateResume, getResumeEvaluation } from '@/store/evaluation/evaluationThunks';
import { clearResumeError } from '@/store/evaluation/evaluationSlice';
import { setInterviewStep } from '@/store/interview/interviewSlice';
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
    // Don't allow file selection if there's already an evaluation
    if (existingEvaluation) {
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
  };

  const uploadAndEvaluateResume = async () => {
    if (!selectedFile || !candidateInfo) return;

    // Don't allow upload if there's already an evaluation
    if (existingEvaluation) {
      return;
    }

    try {
      dispatch(
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
    // Move to step 4 (interview questions)
    dispatch(setInterviewStep(4));
  };

  const handleEvaluationComplete = (evaluation: any) => {
    // If evaluation passes threshold, automatically proceed to interview
    if (evaluation?.passesThreshold) {
      dispatch(setInterviewStep(4));
    }
    // If evaluation fails, stay on current step to show results
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

    // Computed
    hasExistingEvaluation: !!existingEvaluation,
    canProceed: !!existingEvaluation || !!evaluation,
  };
}
