'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { JobData } from '@/lib/services/jobsService';
import InterviewFlow from '@/components/interview/InterviewFlow';
import InterviewComplete from '@/components/interview/InterviewComplete';
import ResumeUpload from '@/components/interview/ResumeUpload';
import { ResumeEvaluation } from '@/types/interview';
import { 
  BriefcaseIcon, 
  ClockIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  SparklesIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{ token: string }>;
}

type InterviewStep = 'intro' | 'info' | 'resume' | 'interview' | 'complete';

export default function InterviewPage({ params }: PageProps) {
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<InterviewStep>('intro');
  const [candidateInfo, setCandidateInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [resumeEvaluation, setResumeEvaluation] = useState<ResumeEvaluation | null>(null);
  const [resumeContent, setResumeContent] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<{ token: string } | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Fetch job data
  useEffect(() => {
    if (!resolvedParams?.token) return;

    const fetchJob = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/interview/${resolvedParams.token}`);
        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'Interview link not found');
          return;
        }

        setJob(data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [resolvedParams]);

  const handleStartInterview = () => {
    setCurrentStep('info');
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateInfo.firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    setError(null);
    setCurrentStep('resume');
  };

  const handleResumeEvaluationComplete = (evaluation: ResumeEvaluation, content: string) => {
    setResumeEvaluation(evaluation);
    setResumeContent(content);
    
    if (evaluation.passesThreshold) {
      setCurrentStep('interview');
    }
    // If evaluation fails, user stays on resume upload step with results
  };

  const handleInterviewComplete = () => {
    setCurrentStep('complete');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-text">Loading interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return notFound();
  }

  if (!job || !resolvedParams) return null;

  // Show interview completion
  if (currentStep === 'complete') {
    return <InterviewComplete job={job} />;
  }

  // Show actual interview (after resume evaluation passes)
  if (currentStep === 'interview' && resumeEvaluation?.passesThreshold) {
    return (
      <InterviewFlow 
        jobToken={resolvedParams.token}
        job={job}
        candidateInfo={candidateInfo}
        resumeEvaluation={resumeEvaluation}
        resumeContent={resumeContent}
        onComplete={handleInterviewComplete}
      />
    );
  }

  // Show resume upload step
  if (currentStep === 'resume') {
    return (
      <ResumeUpload
        jobToken={resolvedParams.token}
        job={job}
        candidateInfo={candidateInfo}
        onEvaluationComplete={handleResumeEvaluationComplete}
      />
    );
  }

  // Show candidate info form
  if (currentStep === 'info') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <BriefcaseIcon className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Let&apos;s Get Started</h1>
            <p className="text-muted-text">
              Please provide your basic information before we begin the interview process.
            </p>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={candidateInfo.firstName}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={candidateInfo.lastName}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={candidateInfo.email}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Continue to Resume Upload
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentStep('intro')}
              className="text-primary hover:text-primary/80 text-sm"
            >
              ← Back to Job Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show interview introduction (default)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">AI Interview</h1>
            <p className="text-muted-text">You&apos;re about to take an AI-powered interview</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text mb-2">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-text">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>20-30 minutes</span>
              </div>
              <div className="flex items-center">
                {job.interviewFormat === 'video' ? (
                  <VideoCameraIcon className="w-4 h-4 mr-1" />
                ) : (
                  <DocumentTextIcon className="w-4 h-4 mr-1" />
                )}
                <span>{job.interviewFormat === 'video' ? 'Video' : 'Text'} Interview</span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          {job.fields?.jobDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text mb-3">About this role</h3>
              <div 
                className="prose prose-sm max-w-none text-muted-text"
                dangerouslySetInnerHTML={{ __html: job.fields.jobDescription }}
              />
            </div>
          )}

          {/* Requirements */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Skills */}
            {job.fields?.skills && job.fields.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-text mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.fields.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Traits */}
            {job.fields?.traits && job.fields.traits.length > 0 && (
              <div>
                <h3 className="font-semibold text-text mb-3">Key Qualities</h3>
                <div className="flex flex-wrap gap-2">
                  {job.fields.traits.map((trait, index) => (
                    <span
                      key={index}
                      className="bg-accent-blue/10 text-accent-blue px-3 py-1 rounded-full text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level */}
            {job.fields?.experienceLevel && (
              <div>
                <h3 className="font-semibold text-text mb-3">Experience Level</h3>
                <span className="bg-accent-teal/10 text-accent-teal px-3 py-1 rounded-full text-sm capitalize">
                  {job.fields.experienceLevel}
                </span>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-text mb-3">Additional Requirements</h3>
              <div className="space-y-2">
                {Object.entries(job.fields.customFields).map(([key, field]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-text">{key}:</span>{' '}
                    <span className="text-muted-text">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interview Process */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-text mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-primary" />
            Interview Process
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-text">Resume Evaluation</h4>
                <p className="text-muted-text text-sm">Upload your resume for AI analysis against job requirements (60% minimum score required).</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-text">AI Interview Questions</h4>
                <p className="text-muted-text text-sm">Answer personalized questions based on the job requirements and your background.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-text">Evaluation & Review</h4>
                <p className="text-muted-text text-sm">Our AI evaluates your responses and provides insights to the hiring team.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Before You Begin</h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Have your resume ready in PDF, DOC, DOCX, or TXT format</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Find a quiet space where you won&apos;t be interrupted</span>
            </div>
            {job.interviewFormat === 'video' && (
              <div className="flex items-center">
                <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Ensure your camera and microphone are working properly</span>
              </div>
            )}
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Take your time - there&apos;s no rush to complete the interview</span>
            </div>
            <div className="flex items-center">
              <ChevronRightIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Be honest and authentic in your responses</span>
            </div>
          </div>
        </div>

        {/* Start Interview Button */}
        <div className="text-center">
          <button
            onClick={handleStartInterview}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center mx-auto"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Interview Process
          </button>
          <p className="text-sm text-muted-text mt-4">
            The complete process takes approximately 20-30 minutes
          </p>
        </div>
      </div>
    </div>
  );
} 