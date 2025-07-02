'use client';

import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import { JobData } from '@/lib/services/jobsService';
import { ResumeEvaluation } from '@/types/interview';
import { evaluateResume } from '@/store/evaluation/evaluationThunks';
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
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ResumeUploadProps {
  jobToken: string;
  job: JobData;
  candidateInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onEvaluationComplete: (evaluation: ResumeEvaluation, resumeContent: string) => void;
}

export default function ResumeUpload({ 
  jobToken, 
  job, 
  candidateInfo,
  onEvaluationComplete 
}: ResumeUploadProps) {
  const dispatch = useDispatch<AppDispatch>();
  const evaluation = useSelector(selectCurrentResumeEvaluation);
  const isLoading = useSelector(selectResumeEvaluationLoading);
  const error = useSelector(selectResumeEvaluationError);
  const isUploading = useSelector(selectIsUploading);
  const uploadProgress = useSelector(selectUploadProgress);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit. Please upload a smaller file.'
      };
    }

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files only.'
      };
    }

    if (file.size < 100) {
      return {
        isValid: false,
        error: 'File appears to be empty. Please upload a valid resume file.'
      };
    }

    return { isValid: true };
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
      const result = await dispatch(evaluateResume({
        resumeFile: selectedFile,
        jobToken,
        candidateInfo
      })).unwrap();

      console.log('Resume evaluation completed:', result);
    } catch (err) {
      console.error('Error evaluating resume:', err);
    }
  };

  const proceedToInterview = () => {
    if (evaluation && selectedFile) {
      // For processed documents, we'll use the evaluation summary as content reference
      const mockContent = `Resume for ${candidateInfo.firstName} ${candidateInfo.lastName}
Evaluation Score: ${evaluation.score}/100
Skills Found: ${evaluation.matchingSkills.join(', ')}
Experience Level: ${evaluation.experienceMatch}`;
      
      onEvaluationComplete(evaluation, mockContent);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
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

  // Show evaluation results
  if (evaluation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-primary/10">
              <SparklesIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Resume Evaluation Complete</h1>
            <p className="text-muted-text">
              Our AI has analyzed your resume against the {job.title} requirements
            </p>
          </div>

          {/* Overall Score */}
          <div className={`bg-white rounded-lg shadow-lg p-6 mb-6 border-2 ${getScoreBgColor(evaluation.score)}`}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                {evaluation.passesThreshold ? (
                  <CheckCircleIcon className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircleIcon className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${getScoreColor(evaluation.score)}`}>
                {evaluation.score}/100
              </h2>
              <p className="text-lg font-semibold text-text mb-4">
                {evaluation.passesThreshold ? 'You qualify for the interview!' : 'Resume does not meet minimum requirements'}
              </p>
              <p className="text-muted-text">{evaluation.summary}</p>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Matching Skills */}
            {evaluation.matchingSkills.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-text">Matching Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evaluation.matchingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {evaluation.missingSkills.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="font-semibold text-text">Areas for Development</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evaluation.missingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-text mb-3">Experience Assessment</h3>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  evaluation.experienceMatch === 'match' 
                    ? 'bg-green-100 text-green-800'
                    : evaluation.experienceMatch === 'over'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {evaluation.experienceMatch === 'match' ? 'Good Match' : 
                   evaluation.experienceMatch === 'over' ? 'Overqualified' : 'Underqualified'}
                </span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-text mb-3">AI Recommendation</h3>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  evaluation.recommendation === 'proceed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {evaluation.recommendation === 'proceed' ? 'Proceed to Interview' : 'Not Recommended'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="font-semibold text-text mb-4">Detailed Analysis</h3>
            <div className="prose prose-sm max-w-none text-muted-text whitespace-pre-line">
              {evaluation.feedback}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            {evaluation.passesThreshold ? (
              <div>
                <Button onClick={proceedToInterview} className="w-full sm:w-auto">
                  Continue to Interview
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-sm text-muted-text mt-4">
                  Congratulations! You meet the minimum requirements for this position.
                </p>
              </div>
            ) : (
              <div>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
                  Try Different Resume
                </Button>
                <p className="text-sm text-muted-text mt-4">
                  Unfortunately, your current resume doesn&apos;t meet the minimum requirements. 
                  You may try uploading a different version or apply for other positions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main upload interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error || validationError}</p>
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

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Enhanced Resume Analysis</h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Advanced document parsing for PDF, DOC, DOCX, and TXT files</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>AI-powered skill matching and experience evaluation</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Score of 60+ required to proceed to interview</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Detailed feedback on qualifications and fit</span>
            </div>
          </div>
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