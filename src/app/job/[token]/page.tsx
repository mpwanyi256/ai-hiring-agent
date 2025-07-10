'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TopNavigation from '@/components/navigation/TopNavigation';
import Image from 'next/image';
import {
  ClockIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface JobData {
  id: string;
  title: string;
  fields: any;
  interviewFormat: string;
  interviewToken: string;
  isActive: boolean;
  status: string;
  candidateCount: number;
  profileId: string;
  companyName: string;
  companyLogo: string;
  companySlug: string;
  createdAt: string;
  updatedAt: string;
}

export default function PublicJobPage() {
  const { token } = useParams<{ token: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'application'>('overview');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`/api/jobs/interview/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch job');
        setJob(data.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const renderOverviewTab = () => {
    if (!job) return null;

    return (
      <div className="space-y-8">
        {/* Job Information */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                <span>{job.interviewFormat === 'video' ? 'Video' : 'Text'} Application</span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          {job.fields?.jobDescription && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About this role</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.fields.jobDescription }}
              />
            </div>
          )}
        </div>

        {/* Application Process */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-blue-600" />
            Application Process
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Resume Evaluation</h4>
                <p className="text-gray-600 text-sm">
                  Upload your resume for analysis against job requirements (60% minimum score
                  required).
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Application Questions</h4>
                <p className="text-gray-600 text-sm">
                  Answer personalized questions based on the job requirements and your background.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Evaluation & Review</h4>
                <p className="text-gray-600 text-sm">
                  Your responses are evaluated and insights are provided to the hiring team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Guidelines */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Be Authentic</p>
                  <p>Answer honestly and let your personality shine through your responses.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Take Your Time</p>
                  <p>There&apos;s no time pressure. Think through your answers carefully.</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Use Examples</p>
                  <p>Support your answers with specific examples from your experience.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">Stay Professional</p>
                  <p>Maintain a professional tone while being conversational.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderApplicationTab = () => {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 w-full p-8">
        <div className="mb-6">
          <div className="text-xl font-bold text-gray-900 mb-2">Application</div>
          <div className="text-gray-600 text-sm mb-4">
            Please fill out the form below to apply for this position.
          </div>
        </div>
        {/* Application form fields go here */}
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
            <input
              type="file"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold rounded-lg py-2 mt-4 hover:bg-blue-700 transition"
          >
            Submit Application
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#f7f7f8] flex flex-col items-center px-2 py-8">
      <TopNavigation showAuthButtons={false} />
      <div className="w-full max-w-6xl flex flex-col items-center mb-10 mt-8">
        {loading && <div className="text-gray-500 text-lg py-20">Loading job details...</div>}
        {error && <div className="text-red-600 text-lg py-20">{error}</div>}
        {!loading && !error && job && (
          <>
            {/* Main Content: Two Columns */}
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-16 items-start justify-start">
              {/* Left: Job Info Sidebar */}
              <aside className="w-full lg:w-1/3 flex-shrink-0 lg:border-r lg:border-gray-200 lg:pr-10 mb-8 lg:mb-0">
                <div className="p-6">
                  {/* Company Branding */}
                  {(job.companyLogo || job.companyName) && (
                    <div className="mb-6">
                      {job.companyLogo && (
                        <Image
                          src={job.companyLogo}
                          alt={job.companyName}
                          width={56}
                          height={56}
                          className="rounded-full object-cover border border-gray-200 bg-white mx-auto mb-2"
                        />
                      )}
                      <div className="text-2xl font-bold text-gray-900">{job.companyName}</div>
                      {job.companySlug && (
                        <div className="text-xs text-gray-400 mt-0.5">{job.companySlug}</div>
                      )}
                    </div>
                  )}

                  {/* Job Title */}
                  <div className="text-2xl font-semibold text-gray-900 mb-6 leading-tight">
                    {job.title}
                  </div>

                  {/* Job Details */}
                  <div className="mb-6 text-sm text-gray-700 space-y-3">
                    {job.fields?.location && (
                      <div>
                        <span className="font-medium text-gray-500">Location:</span>{' '}
                        {job.fields.location}
                      </div>
                    )}
                    {job.fields?.employmentType && (
                      <div>
                        <span className="font-medium text-gray-500">Employment Type:</span>{' '}
                        {job.fields.employmentType}
                      </div>
                    )}
                    {job.fields?.workplaceType && (
                      <div>
                        <span className="font-medium text-gray-500">Location Type:</span>{' '}
                        {job.fields.workplaceType}
                      </div>
                    )}
                    {job.fields?.department && (
                      <div>
                        <span className="font-medium text-gray-500">Department:</span>{' '}
                        {job.fields.department}
                      </div>
                    )}
                    {job.fields?.compensation && (
                      <div>
                        <span className="font-medium text-gray-500">Compensation:</span>{' '}
                        <pre className="inline whitespace-pre-wrap font-sans text-gray-700">
                          {job.fields.compensation}
                        </pre>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-500">Application Format:</span>{' '}
                      {job.interviewFormat === 'video' ? 'Video' : 'Text'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Duration:</span> 20-30 minutes
                    </div>
                  </div>

                  {/* Required Skills */}
                  {job.fields?.skills && job.fields.skills.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.fields.skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Qualities */}
                  {job.fields?.traits && job.fields.traits.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Key Qualities</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.fields.traits.map((trait: string, index: number) => (
                          <span
                            key={index}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Level */}
                  {job.fields?.experienceLevel && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Experience Level</h3>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
                        {job.fields.experienceLevel}
                      </span>
                    </div>
                  )}

                  {/* Custom Fields */}
                  {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Additional Requirements</h3>
                      <div className="space-y-2">
                        {Object.entries(job.fields.customFields).map(
                          ([key, field]: [string, any]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium text-gray-900">{key}:</span>{' '}
                              <span className="text-gray-700">{field.value}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Right: Tabbed Content */}
              <main className="w-full lg:w-2/3">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('application')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'application'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Application
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[600px]">
                  {activeTab === 'overview' ? renderOverviewTab() : renderApplicationTab()}
                </div>
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
