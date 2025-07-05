'use client';

import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import { evaluateResume } from '@/store/evaluation/evaluationThunks';
import { clearResumeError } from '@/store/evaluation/evaluationSlice';
import { 
  selectCurrentResumeEvaluation,
  selectResumeEvaluationLoading,
  selectResumeEvaluationError,
  selectIsUploading,
  selectUploadProgress 
} from '@/store/evaluation/evaluationSelectors';
import { AppDispatch } from '@/store';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { validateFile } from '@/lib/utils';
import { CandidateResumeEvaluation } from '../resumeStep/CandidateResumeEvaluation';
import { loadedInterview, selectCandidate } from '@/store/interview/interviewSelectors';
import { useAppSelector } from '@/store';
import { apiError } from '@/lib/notification';

interface ResumeUploadProps {
  jobToken: string;
}

export default function ResumeUpload({ 
  jobToken
}: ResumeUploadProps) {
  const dispatch = useDispatch<AppDispatch>();
  const evaluation = useSelector(selectCurrentResumeEvaluation);
  const isLoading = useSelector(selectResumeEvaluationLoading);
  const error = useSelector(selectResumeEvaluationError);
  const isUploading = useSelector(selectIsUploading);
  const uploadProgress = useSelector(selectUploadProgress);
  const job = useAppSelector(loadedInterview);
  const candidateInfo = useAppSelector(selectCandidate);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to determine error type and message
  const getErrorInfo = () => {
    if (!error) return null;
    
    // Check if this is a system error vs evaluation failure
    // For now, we'll check the error message content to determine type
    const isSystemError = error.includes('database') || 
                         error.includes('System error') || 
                         error.includes('Failed to parse') ||
                         error.includes('configuration error');
    
    const isDatabaseError = error.includes('database') || error.includes('Database error');
    
    if (isDatabaseError) {
      return {
        type: 'database',
        title: 'Technical Issue Encountered',
        message: 'We successfully analyzed your resume, but encountered a technical issue while saving the results. Your evaluation is still available below.',
        canProceed: evaluation !== null, // Can proceed if we have evaluation data
        icon: '⚠️',
        color: 'yellow'
      };
    } else if (isSystemError) {
      return {
        type: 'system',
        title: 'System Error',
        message: error,
        canProceed: false,
        icon: '❌',
        color: 'red'
      };
    } else {
      return {
        type: 'validation',
        title: 'File Processing Error',
        message: error,
        canProceed: false,
        icon: '❌',
        color: 'red'
      };
    }
  };

  const handleFileSelect = (file: File) => {
    setValidationError(null);
    
    const validation = validateFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadAndEvaluateResume = async () => {
    if (!selectedFile) return;

    try {
      if (!candidateInfo) {
        apiError('Candidate information not found. Please try again.');
        return;
      }

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

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📋';
      default:
        return '📎';
    }
  };

  if (!job) {
    return <div>Loading...</div>;
  }

  // Show evaluation results
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
        {(error || validationError) && (
          <div className={`border rounded-lg p-4 mb-6 ${
            getErrorInfo()?.color === 'yellow' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              <span className="text-2xl mr-3 mt-1">
                {getErrorInfo()?.icon || '❌'}
              </span>
              <div className="flex-1">
                <h4 className={`font-semibold mb-2 ${
                  getErrorInfo()?.color === 'yellow' 
                    ? 'text-yellow-800' 
                    : 'text-red-800'
                }`}>
                  {getErrorInfo()?.title || 'Error'}
                </h4>
                <p className={`text-sm ${
                  getErrorInfo()?.color === 'yellow' 
                    ? 'text-yellow-700' 
                    : 'text-red-700'
                }`}>
                  {getErrorInfo()?.message || error || validationError}
                </p>
                
                {/* Database error with evaluation available */}
                {getErrorInfo()?.type === 'database' && evaluation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800 text-sm font-medium">
                      ✅ Good news: Your resume evaluation completed successfully!
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      You can review your results and continue to the interview below.
                    </p>
                  </div>
                )}
                
                {/* Retry button for system errors */}
                {(getErrorInfo()?.type === 'system' || getErrorInfo()?.type === 'validation') && (
                  <button
                    onClick={() => {
                      dispatch(clearResumeError());
                      setValidationError(null);
                    }}
                    className="mt-3 text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 transition-colors"
                  >
                    Dismiss Error
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <CloudArrowUpIcon className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-blue-800 font-medium">Evaluating your resume...</p>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(uploadProgress, 90)}%` }}
              ></div>
            </div>
            <p className="text-blue-600 text-sm mt-2">
              Parsing document and analyzing content...
            </p>
          </div>
        )}

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : selectedFile 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <div className="text-4xl">{getFileIcon(selectedFile.name)}</div>
              <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-lg font-semibold text-green-800">File Selected</p>
              <p className="text-green-700">{selectedFile.name}</p>
              <p className="text-sm text-green-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-lg font-semibold text-text">
                Drag and drop your resume here
              </p>
              <p className="text-muted-text">or click to browse files</p>
              <p className="text-sm text-muted-text">
                Supports PDF, DOC, DOCX, and TXT files (up to 10MB)
              </p>
            </div>
          )}
        </div>

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