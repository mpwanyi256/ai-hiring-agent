'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import { JobData } from '@/lib/services/jobsService';
import { ResumeEvaluation } from '@/types/interview';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [evaluation, setEvaluation] = useState<ResumeEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Please upload files smaller than 5MB.');
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

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('jobToken', jobToken);
      formData.append('email', candidateInfo.email);
      formData.append('firstName', candidateInfo.firstName);
      formData.append('lastName', candidateInfo.lastName);

      const response = await fetch('/api/interview/resume/evaluate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to evaluate resume');
      }

      setEvaluation(data.evaluation);
    } catch (err) {
      console.error('Error evaluating resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate resume');
    } finally {
      setIsUploading(false);
    }
  };

  const proceedToInterview = () => {
    if (evaluation && selectedFile) {
      // Read file content for the interview context
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        onEvaluationComplete(evaluation, content);
      };
      reader.readAsText(selectedFile);
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

  // Show upload interface
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
            Let our AI evaluate your qualifications for the <strong>{job.title}</strong> position
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary hover:bg-primary/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
          >
            <CloudArrowUpIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
            
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-text font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-text">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-medium text-text mb-2">
                    Drag and drop your resume here
                  </p>
                  <p className="text-muted-text">or</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <p className="text-sm text-muted-text">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">How Resume Evaluation Works</h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Our AI analyzes your resume against job requirements</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>We check for relevant skills, experience, and qualifications</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>You need a score of 60+ to proceed to the interview</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Get detailed feedback on your qualifications</span>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="text-center">
          <Button
            onClick={uploadAndEvaluateResume}
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? 'Evaluating Resume...' : 'Evaluate Resume'}
          </Button>
          {selectedFile && (
            <p className="text-sm text-muted-text mt-4">
              This process typically takes 10-15 seconds
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 