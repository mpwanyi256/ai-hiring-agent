'use client';

import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import { JobData } from '@/lib/services/jobsService';
import { ResumeEvaluation } from '@/types/interview';
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
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ResumeUploadProps {
  jobToken: string;
  job: JobData;
  candidateId: string;
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
  candidateId,
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
    if (score >= 80) return 'bg-green-50 border-green-300';
    if (score >= 60) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon className="w-8 h-8 text-green-600" />;
    if (score >= 60) return <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />;
    return <XCircleIcon className="w-8 h-8 text-red-600" />;
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-accent shadow-lg">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text mb-3">Resume Analysis Complete</h1>
            <p className="text-lg text-muted-text max-w-2xl mx-auto">
              Our AI has carefully analyzed your resume against the requirements for the{' '}
              <span className="font-semibold text-primary">{job.title}</span> position
            </p>
          </div>

          {/* Overall Score Card */}
          <div className={`bg-white rounded-xl shadow-lg p-8 mb-8 border-2 ${getScoreBgColor(evaluation.score)} transition-all duration-300`}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                {getScoreIcon(evaluation.score)}
              </div>
              <div className="mb-4">
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(evaluation.score)}`}>
                  {evaluation.score}<span className="text-2xl text-muted-text">/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      evaluation.score >= 80 ? 'bg-green-500' :
                      evaluation.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${evaluation.score}%` }}
                  ></div>
                </div>
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${getScoreColor(evaluation.score)}`}>
                {evaluation.passesThreshold ? 
                  '🎉 Congratulations! You qualify for the interview' : 
                  'Resume needs improvement to meet requirements'
                }
              </h2>
              <p className="text-lg text-muted-text max-w-3xl mx-auto leading-relaxed">
                {evaluation.summary}
              </p>
            </div>
          </div>

          {/* Analysis Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Skills Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-lg">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-text">Skills Assessment</h3>
              </div>
              
              {evaluation.matchingSkills.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-green-700 mb-2">✅ Matching Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.matchingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {evaluation.missingSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-2">📚 Development Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Assessment */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-bold text-lg">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-text">Experience Level</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  evaluation.experienceMatch === 'match' 
                    ? 'bg-green-100 text-green-800'
                    : evaluation.experienceMatch === 'over'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {evaluation.experienceMatch === 'match' ? '✅ Perfect Match' : 
                   evaluation.experienceMatch === 'over' ? '🚀 Overqualified' : '📈 Developing'}
                </span>
              </div>
              <p className="text-sm text-muted-text mt-3">
                {evaluation.experienceMatch === 'match' ? 
                  'Your experience level aligns well with our requirements.' :
                  evaluation.experienceMatch === 'over' ?
                  'You have more experience than required for this role.' :
                  'With some growth, you could be a great fit for this position.'
                }
              </p>
            </div>

            {/* AI Recommendation */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold text-lg">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-text">AI Recommendation</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  evaluation.recommendation === 'proceed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {evaluation.recommendation === 'proceed' ? '✅ Proceed to Interview' : '❌ Not Recommended'}
                </span>
              </div>
              <p className="text-sm text-muted-text mt-3">
                {evaluation.recommendation === 'proceed' ? 
                  'Our AI believes you have strong potential for this role.' :
                  'Consider strengthening your profile before applying.'
                }
              </p>
            </div>

            {/* Overall Assessment */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-lg">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-text">Match Summary</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-text">Skills Match</span>
                  <span className="text-sm font-medium">
                    {evaluation.matchingSkills.length}/{evaluation.matchingSkills.length + evaluation.missingSkills.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-text">Overall Score</span>
                  <span className={`text-sm font-medium ${getScoreColor(evaluation.score)}`}>
                    {evaluation.score}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-text">Status</span>
                  <span className={`text-sm font-medium ${
                    evaluation.passesThreshold ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {evaluation.passesThreshold ? 'Qualified' : 'Not Qualified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            {evaluation.passesThreshold ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">Ready for the Next Step!</h3>
                  <p className="text-muted-text mb-6">
                    You&apos;ve passed our initial screening. Let&apos;s continue with the interview questions 
                    to learn more about your experience and fit for this role.
                  </p>
                </div>
                <Button 
                  onClick={proceedToInterview} 
                  className="w-full sm:w-auto px-8 py-3 text-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-300"
                >
                  Continue to Interview Questions
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-sm text-muted-text">
                  The interview will take approximately 10-15 minutes to complete.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">Keep Improving!</h3>
                  <p className="text-muted-text mb-6">
                    While your resume doesn&apos;t meet our current minimum requirements, 
                    we encourage you to continue developing your skills and experience.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-2"
                  >
                    Try Different Resume
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/jobs', '_blank')} 
                    className="px-6 py-2"
                  >
                    Browse Other Positions
                  </Button>
                </div>
                <p className="text-sm text-muted-text">
                  Consider strengthening the highlighted skill areas and gaining more relevant experience.
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