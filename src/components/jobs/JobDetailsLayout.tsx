'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { CurrentJob } from '@/types/jobs';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  PencilIcon,
  ShareIcon,
  EyeIcon,
  LinkIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../layout/DashboardLayout';
import { useAppDispatch } from '@/store';
import { updateJobStatus, updateJob } from '@/store/jobs/jobsThunks';
import { apiError, apiSuccess } from '@/lib/notification';
import EditJobDetailsModal from "./EditJobDetailsModal";
import RichTextEditor from '../ui/RichTextEditor';

interface JobDetailsLayoutProps {
  job: CurrentJob;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShareJob?: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
  { id: 'questions', label: 'Questions', icon: ClipboardDocumentListIcon },
  { id: 'candidates', label: 'Candidates', icon: UserGroupIcon }
];

export default function JobDetailsLayout({ 
  job, 
  children, 
  activeTab, 
  onTabChange,
  onShareJob 
}: JobDetailsLayoutProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isToggling, setIsToggling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isEditJobDetailsOpen, setIsEditJobDetailsOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [jobDescriptionDraft, setJobDescriptionDraft] = useState(job.fields?.jobDescription || '');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'interviewing':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'closed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'interviewing':
        return 'Interviewing';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const toggleJobStatus = async () => {
    setIsToggling(true);
    // TODO: Implement job status toggle
    setTimeout(() => setIsToggling(false), 1000);
  };

  const handleStatusUpdate = async (newStatus: 'draft' | 'interviewing' | 'closed') => {
    if (newStatus === job.status) {
      setShowStatusDropdown(false);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await dispatch(updateJobStatus({ jobId: job.id, status: newStatus })).unwrap();
      apiSuccess(`Job status updated to ${getStatusLabel(newStatus)}`);
      setShowStatusDropdown(false);
    } catch (error) {
      apiError(error instanceof Error ? error.message : 'Failed to update job status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <button
          onClick={() => router.push('/dashboard/jobs')}
          className="flex items-center hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          All Jobs
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{job.title}</span>
      </div>

      {/* Job Header */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-4">
              {/* Job Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BriefcaseIcon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{job.candidateCount || 0} candidates</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{job.interviewFormat === 'text' ? 'Text' : 'Video'} interview</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      disabled={isUpdatingStatus}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)} hover:bg-opacity-80 transition-colors disabled:opacity-50`}
                    >
                      {getStatusLabel(job.status)}
                      <ChevronDownIcon className="w-3 h-3 ml-1" />
                    </button>
                    
                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                        <div className="py-1">
                          {['draft', 'interviewing', 'closed'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(status as 'draft' | 'interviewing' | 'closed')}
                              disabled={isUpdatingStatus}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50 ${
                                status === job.status ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              {getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    job.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {job.fields?.experienceLevel && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()} Level
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShareJob}
              className="flex items-center text-sm"
            >
              <ShareIcon className="w-4 h-4 mr-1" />
              Share
            </Button>
            
            <Link href={job.interviewLink || `/interview/${job.interviewToken}`} target="_blank">
              <Button size="sm" className="flex items-center text-sm">
                <EyeIcon className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-100 mt-6 -mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'candidates' && (job.candidateCount || 0) > 0 && (
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs font-medium">
                      {job.candidateCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Requirements Section (Experience Level, Skills, Traits) */}
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Requirements</h2>
              {job.status === 'draft' && editingField === null && (
                <Button size="sm" variant="outline" onClick={() => setEditingField('requirements')}>
                  <PencilIcon className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
            </div>
            {editingField === 'requirements' ? (
              <div className="space-y-4">
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={job.fields?.experienceLevel || ''}
                    onChange={e => dispatch(updateJob({
                      id: job.id,
                      fields: { ...job.fields, experienceLevel: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select experience level (optional)</option>
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                  {/* TODO: Add dropdown/tag UI for editing skills, similar to job creation */}
                </div>
                {/* Traits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desired Traits</label>
                  {/* TODO: Add dropdown/tag UI for editing traits, similar to job creation */}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => setEditingField(null)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="block text-xs font-medium text-muted-text mb-1">Experience Level</span>
                  <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs text-gray-700 capitalize">
                    {job.fields?.experienceLevel || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-muted-text mb-1">Required Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {(job.fields?.skills || []).map((skill: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-medium text-muted-text mb-1">Desired Traits</span>
                  <div className="flex flex-wrap gap-2">
                    {(job.fields?.traits || []).map((trait: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info Section (Custom Fields) */}
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Additional Information</h2>
              {job.status === 'draft' && editingField === null && (
                <Button size="sm" variant="outline" onClick={() => setEditingField('customFields')}>
                  <PencilIcon className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
            </div>
            {/* TODO: Add inline editing for custom fields, similar to job creation */}
            <div>
              {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 ? (
                Object.entries(job.fields.customFields).map(([key, field]: any) => (
                  <div key={key} className="mb-2">
                    <span className="font-medium text-sm text-gray-700">{key}</span>
                    <div className="text-xs text-gray-600">{field.value}</div>
                  </div>
                ))
              ) : (
                <span className="text-muted-text text-sm">No additional information provided.</span>
              )}
            </div>
          </div>

          {/* Job Description Section (already inline editable) */}
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
              {job.status === 'draft' && editingField !== 'jobDescription' && (
                <Button size="sm" variant="outline" onClick={() => setEditingField('jobDescription')}>
                  <PencilIcon className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
            </div>
            {editingField === 'jobDescription' ? (
              <div>
                <RichTextEditor
                  content={jobDescriptionDraft}
                  onChange={setJobDescriptionDraft}
                  placeholder="Describe the role, responsibilities, requirements, and what you offer..."
                  className="w-full"
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    isLoading={isSavingDescription}
                    onClick={async () => {
                      setIsSavingDescription(true);
                      try {
                        await dispatch(updateJob({
                          id: job.id,
                          fields: {
                            ...job.fields,
                            jobDescription: jobDescriptionDraft,
                          },
                        })).unwrap();
                        apiSuccess('Job description updated');
                        setEditingField(null);
                      } catch (error) {
                        apiError('Failed to update job description');
                      } finally {
                        setIsSavingDescription(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setJobDescriptionDraft(job.fields?.jobDescription || '');
                      setEditingField(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.fields?.jobDescription || '<span class=\"text-muted-text\">No description provided.</span>' }} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Job Info (read-only summary) */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-500">Status</span>
                <p className="text-xs text-gray-900 mt-1">{getStatusLabel(job.status)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">Interview Format</span>
                <p className="text-xs text-gray-900 mt-1 capitalize">
                  {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
                </p>
              </div>
              {job.fields?.experienceLevel && (
                <div>
                  <span className="text-xs font-medium text-gray-500">Experience Level</span>
                  <p className="text-xs text-gray-900 mt-1 capitalize">
                    {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-gray-500">Created</span>
                <p className="text-xs text-gray-900 mt-1">{formatDate(job.createdAt)}</p>
              </div>
            </div>
          </div>
          {/* Skills (read-only summary) */}
          {job.fields?.skills && job.fields.skills.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-1">
                {job.fields.skills.map((skill: string, index: number) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 