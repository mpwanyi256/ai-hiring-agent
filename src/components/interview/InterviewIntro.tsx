'use client';

import { 
  BriefcaseIcon, 
  ClockIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  SparklesIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadedInterview } from '@/store/interview/interviewSelectors';
import { apiSuccess } from '@/lib/notification';
import { setInterviewStep } from '@/store/interview/interviewSlice';

export default function InterviewIntro() {
  const job = useAppSelector(loadedInterview);
  const dispatch = useAppDispatch();

  const handleStartInterview = () => {
    dispatch(setInterviewStep(2));
  }

  if (!job) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-text">Loading interview...</p>
      </div>
    </div>)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BriefcaseIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Interview</h1>
            <p className="text-muted-text">You&apos;re about to take an interview</p>
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
                <p className="text-muted-text text-sm">Upload your resume for analysis against job requirements (60% minimum score required).</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-text">Interview Questions</h4>
                <p className="text-muted-text text-sm">Answer personalized questions based on the job requirements and your background.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-text">Evaluation & Review</h4>
                <p className="text-muted-text text-sm">Your responses are evaluated and insights are provided to the hiring team.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Guidelines */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-text mb-4">Interview Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-text">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-text">Be Authentic</p>
                  <p>Answer honestly and let your personality shine through your responses.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-text">Take Your Time</p>
                  <p>There's no time pressure. Think through your answers carefully.</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-text">Use Examples</p>
                  <p>Support your answers with specific examples from your experience.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-text">Stay Professional</p>
                  <p>Maintain a professional tone while being conversational.</p>
                </div>
              </div>
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