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
  PauseIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../layout/DashboardLayout';

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
  const [isToggling, setIsToggling] = useState(false);

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
        return 'Active';
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
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
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
              onClick={toggleJobStatus}
              disabled={isToggling}
              className="flex items-center text-sm"
            >
              {job.isActive ? (
                <PauseIcon className="w-4 h-4 mr-1" />
              ) : (
                <PlayIcon className="w-4 h-4 mr-1" />
              )}
              {isToggling ? 'Updating...' : (job.isActive ? 'Pause' : 'Activate')}
            </Button>

            <Link href={`/dashboard/jobs/${job.id}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center text-sm">
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>
            
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
        <div className="lg:col-span-3">
          {children}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link 
                href={job.interviewLink || `/interview/${job.interviewToken}`}
                target="_blank"
                className="block"
              >
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Interview Link
                </Button>
              </Link>
              
              {(job.candidateCount || 0) > 0 && (
                <Link href={`/dashboard/candidates?job=${job.id}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    View All Candidates
                  </Button>
                </Link>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onTabChange('questions')}
                className="w-full justify-start text-xs"
              >
                <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                Manage Questions
              </Button>
            </div>
          </div>

          {/* Job Info */}
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

          {/* Skills */}
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