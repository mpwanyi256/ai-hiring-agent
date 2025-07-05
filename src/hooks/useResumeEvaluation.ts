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
  selectUploadProgress 
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
    if (candidateInfo?.id && jobId) {
      checkExistingEvaluation();
    }
  }, [candidateInfo?.id, jobId]);

  const checkExistingEvaluation = async () => {
    if (!candidateInfo?.id || !jobId) return;
    
    setIsCheckingExisting(true);
    try {
      const result = await dispatch(getResumeEvaluation({
        candidateId: candidateInfo.id,
        jobId
      })).unwrap();
      
      if (result) {
        setExistingEvaluation(result);
      }
    } catch (err) {
      console.error('Error checking existing evaluation:', err);
      // Don't show error to user for this check
    } finally {
      setIsCheckingExisting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setValidationError(null);
    setSelectedFile(file);
  };

  const uploadAndEvaluateResume = async () => {
    if (!selectedFile || !candidateInfo) return;

    try {
      const result = await dispatch(evaluateResume({
        resumeFile: selectedFile,
        jobToken,
        candidateInfo: {
          id: candidateInfo.id,
          email: candidateInfo.email,
          firstName: candidateInfo.firstName,
          lastName: candidateInfo.lastName,
        }
      })).unwrap();

      console.log('Resume evaluation completed:', result);
    } catch (err) {
      console.error('Error evaluating resume:', err);
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
    
    // Computed
    hasExistingEvaluation: !!existingEvaluation,
    canProceed: !!existingEvaluation || !!evaluation
  };
} 