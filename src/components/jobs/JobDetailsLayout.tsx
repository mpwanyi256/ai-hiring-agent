'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Job } from '@/types/jobs';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PencilIcon,
  ShareIcon,
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../layout/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateJobStatus, updateJob } from '@/store/jobs/jobsThunks';
import { apiError, apiSuccess } from '@/lib/notification';
import RichTextEditor from '../ui/RichTextEditor';
import { app, inputTypes } from '@/lib/constants';
import { selectSkillsData, selectSkillsLoading } from '@/store/skills/skillsSelectors';
import { selectTraitsData, selectTraitsLoading } from '@/store/traits/traitsSelectors';
import { fetchSkills } from '@/store/skills/skillsThunks';
import { fetchTraits } from '@/store/traits/traitsThunks';
import { selectCompanySlug } from '@/store/auth/authSelectors';

interface JobDetailsLayoutProps {
  job: Job;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShareJob?: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
  { id: 'questions', label: 'Questions', icon: ClipboardDocumentListIcon },
  { id: 'candidates', label: 'Candidates', icon: UserGroupIcon },
  { id: 'shortlisted', label: 'Shortlisted', icon: ChartBarIcon },
];

export default function JobDetailsLayout({
  job,
  children,
  activeTab,
  onTabChange,
  onShareJob,
}: JobDetailsLayoutProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const companySlug = useAppSelector(selectCompanySlug);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [jobDescriptionDraft, setJobDescriptionDraft] = useState(job.fields?.jobDescription || '');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [customFieldsDraft, setCustomFieldsDraft] = useState(
    job.fields?.customFields
      ? Object.entries(job.fields.customFields).map(([key, field]: [string, unknown]) => {
          const safeField = field as { value?: string | number; inputType?: string };
          return {
            key,
            value: safeField.value !== undefined ? String(safeField.value) : '',
            inputType: safeField.inputType || 'text',
          };
        })
      : [],
  );
  const [isSavingCustomFields, setIsSavingCustomFields] = useState(false);
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);
  const allSkills = useAppSelector(selectSkillsData);
  const allTraits = useAppSelector(selectTraitsData);
  const skillsLoading = useAppSelector(selectSkillsLoading);
  const traitsLoading = useAppSelector(selectTraitsLoading);
  const [skillsDraft, setSkillsDraft] = useState(job.fields?.skills || []);
  const [traitsDraft, setTraitsDraft] = useState(job.fields?.traits || []);
  const [experienceLevelDraft, setExperienceLevelDraft] = useState(
    job.fields?.experienceLevel || '',
  );
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [traitDropdownOpen, setTraitDropdownOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [traitSearch, setTraitSearch] = useState('');

  const availableSkills = allSkills.filter(
    (skill) =>
      !skillsDraft.includes(skill.name) &&
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );
  const availableTraits = allTraits.filter(
    (trait) =>
      !traitsDraft.includes(trait.name) &&
      trait.name.toLowerCase().includes(traitSearch.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
        return 'Published';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
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
    } catch {
      apiError('Failed to update job status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Fetch skills and traits on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([dispatch(fetchSkills()), dispatch(fetchTraits())]);
      } catch {
        console.error('Error fetching skills/traits:');
        apiError('Failed to load skills and traits data');
      }
    };

    fetchData();
  }, [dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Close skills dropdown if clicking outside
      if (skillDropdownOpen && !target.closest('[data-dropdown="skills"]')) {
        setSkillDropdownOpen(false);
        setSkillSearch('');
      }

      // Close traits dropdown if clicking outside
      if (traitDropdownOpen && !target.closest('[data-dropdown="traits"]')) {
        setTraitDropdownOpen(false);
        setTraitSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [skillDropdownOpen, traitDropdownOpen]);

  // Reset drafts when job changes
  useEffect(() => {
    setSkillsDraft(job.fields?.skills || []);
    setTraitsDraft(job.fields?.traits || []);
    setExperienceLevelDraft(job.fields?.experienceLevel || '');
  }, [job.fields?.skills, job.fields?.traits, job.fields?.experienceLevel]);

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
      <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-4 md:mb-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-4">
              {/* Job Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BriefcaseIcon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-lg font-bold text-gray-900 mb-2 md:mb-1">
                  {job.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 md:gap-2 text-sm md:text-xs text-gray-500 mb-3 md:mb-2">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4 md:w-3 md:h-3" />
                    <span>Created {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4 md:w-3 md:h-3" />
                    <span>{job.candidateCount || 0} candidates</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4 md:w-3 md:h-3" />
                    <span>{job.interviewFormat === 'text' ? 'Text' : 'Video'} interview</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      disabled={isUpdatingStatus}
                      className={`inline-flex items-center px-2.5 py-1 md:px-2 md:py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status)} hover:bg-opacity-80 transition-colors disabled:opacity-50`}
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
                              onClick={() =>
                                handleStatusUpdate(status as 'draft' | 'interviewing' | 'closed')
                              }
                              disabled={isUpdatingStatus}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50 ${
                                status === job.status
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-gray-700'
                              }`}
                            >
                              {getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-1 md:px-2 md:py-0.5 rounded-full text-xs font-medium ${
                      job.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {job.fields?.experienceLevel && (
                    <span className="inline-flex items-center px-2.5 py-1 md:px-2 md:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      {job.fields.experienceLevel.replace(/([A-Z])/g, ' $1').trim()} Level
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 lg:mt-0 flex flex-wrap gap-2 md:gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onShareJob}
              className="flex items-center text-sm md:text-xs"
            >
              <ShareIcon className="w-4 h-4 mr-1" />
              Share
            </Button>

            <Link href={`${app.baseUrl}/jobs/${companySlug}/${job.interviewToken}`} target="_blank">
              <Button size="sm" className="flex items-center text-sm">
                <EyeIcon className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-gray-100 mt-6 md:mt-4 -mb-6 md:-mb-4">
          <nav className="flex space-x-8 md:space-x-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 md:py-2 px-1 border-b-2 font-medium text-sm md:text-xs transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <tab.icon className="w-4 h-4 md:w-3 md:h-3" />
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-4">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6 md:space-y-4">
          {activeTab === 'overview' ? (
            <>
              {/* Requirements Section (Experience Level, Skills, Traits) */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-4">
                <div className="flex items-center justify-between mb-4 md:mb-2">
                  <h2 className="text-lg md:text-base font-semibold text-text">Requirements</h2>
                  {job.status === 'draft' && editingField === null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingField('requirements')}
                      disabled={skillsLoading || traitsLoading}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      {skillsLoading || traitsLoading ? 'Loading...' : 'Edit'}
                    </Button>
                  )}
                </div>
                {editingField === 'requirements' ? (
                  <div className="space-y-4">
                    {(skillsLoading || traitsLoading) && (
                      <div className="flex items-center space-x-2 text-sm text-muted-text mb-4">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span>Loading skills and traits data...</span>
                      </div>
                    )}
                    {/* Experience Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={experienceLevelDraft}
                        onChange={(e) => setExperienceLevelDraft(e.target.value)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Required Skills
                      </label>
                      <div className="relative" data-dropdown="skills">
                        <button
                          type="button"
                          onClick={() => setSkillDropdownOpen(!skillDropdownOpen)}
                          disabled={skillsLoading}
                          className="w-full px-4 py-3 border border-gray-light rounded-lg text-left text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between disabled:opacity-50"
                        >
                          <span className="text-muted-text">
                            {skillsLoading ? 'Loading skills...' : 'Search and select skills...'}
                          </span>
                          {skillsLoading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          ) : (
                            <ChevronDownIcon
                              className={`w-5 h-5 text-muted-text transition-transform ${skillDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          )}
                        </button>
                        {skillDropdownOpen && !skillsLoading && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-64 overflow-hidden">
                            <div className="p-3 border-b border-gray-light bg-gray-50">
                              <input
                                type="text"
                                value={skillSearch}
                                onChange={(e) => setSkillSearch(e.target.value)}
                                placeholder="Search skills..."
                                className="w-full px-3 py-2 border border-gray-light rounded text-text placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {availableSkills.length > 0 ? (
                                availableSkills.map((skill) => (
                                  <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => {
                                      setSkillsDraft([...skillsDraft, skill.name]);
                                      setSkillSearch('');
                                      setSkillDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-text hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0"
                                  >
                                    <div>
                                      <p className="font-medium">{skill.name}</p>
                                      {skill.description && (
                                        <p className="text-xs text-muted-text truncate mt-1">
                                          {skill.description}
                                        </p>
                                      )}
                                      <p className="text-xs text-primary capitalize mt-1">
                                        {skill.category}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-muted-text text-sm text-center">
                                  {skillSearch
                                    ? 'No skills found matching your search'
                                    : 'All skills have been selected'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Selected Skills */}
                      {skillsDraft.length > 0 && (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 mt-2 bg-gray-50 rounded-lg border border-gray-light">
                          {skillsDraft.map((skill: string) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() =>
                                  setSkillsDraft(skillsDraft.filter((s: string) => s !== skill))
                                }
                                className="ml-2 text-primary hover:text-accent-red transition-colors"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Traits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desired Traits
                      </label>
                      <div className="relative" data-dropdown="traits">
                        <button
                          type="button"
                          onClick={() => setTraitDropdownOpen(!traitDropdownOpen)}
                          disabled={traitsLoading}
                          className="w-full px-4 py-3 border border-gray-light rounded-lg text-left text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between disabled:opacity-50"
                        >
                          <span className="text-muted-text">
                            {traitsLoading ? 'Loading traits...' : 'Search and select traits...'}
                          </span>
                          {traitsLoading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          ) : (
                            <ChevronDownIcon
                              className={`w-5 h-5 text-muted-text transition-transform ${traitDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          )}
                        </button>
                        {traitDropdownOpen && !traitsLoading && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-64 overflow-hidden">
                            <div className="p-3 border-b border-gray-light bg-gray-50">
                              <input
                                type="text"
                                value={traitSearch}
                                onChange={(e) => setTraitSearch(e.target.value)}
                                placeholder="Search traits..."
                                className="w-full px-3 py-2 border border-gray-light rounded text-text placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {availableTraits.length > 0 ? (
                                availableTraits.map((trait) => (
                                  <button
                                    key={trait.id}
                                    type="button"
                                    onClick={() => {
                                      setTraitsDraft([...traitsDraft, trait.name]);
                                      setTraitSearch('');
                                      setTraitDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-text hover:bg-accent-blue/5 transition-colors border-b border-gray-100 last:border-b-0"
                                  >
                                    <div>
                                      <p className="font-medium">{trait.name}</p>
                                      {trait.description && (
                                        <p className="text-xs text-muted-text truncate mt-1">
                                          {trait.description}
                                        </p>
                                      )}
                                      <p className="text-xs text-accent-blue capitalize mt-1">
                                        {trait.category}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-muted-text text-sm text-center">
                                  {traitSearch
                                    ? 'No traits found matching your search'
                                    : 'All traits have been selected'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Selected Traits */}
                      {traitsDraft.length > 0 && (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 mt-2 bg-gray-50 rounded-lg border border-gray-light">
                          {traitsDraft.map((trait) => (
                            <span
                              key={trait}
                              className="inline-flex items-center px-3 py-1.5 bg-accent-blue/10 text-accent-blue rounded-full text-sm font-medium"
                            >
                              {trait}
                              <button
                                type="button"
                                onClick={() =>
                                  setTraitsDraft(traitsDraft.filter((t) => t !== trait))
                                }
                                className="ml-2 text-accent-blue hover:text-accent-red transition-colors"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        isLoading={isSavingRequirements}
                        onClick={async () => {
                          setIsSavingRequirements(true);
                          try {
                            await dispatch(
                              updateJob({
                                id: job.id,
                                fields: {
                                  ...job.fields,
                                  experienceLevel: experienceLevelDraft,
                                  skills: skillsDraft,
                                  traits: traitsDraft,
                                },
                              }),
                            ).unwrap();
                            apiSuccess('Requirements updated successfully');
                            setEditingField(null);
                          } catch {
                            apiError('Failed to update requirements');
                          } finally {
                            setIsSavingRequirements(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSkillsDraft(job.fields?.skills || []);
                          setTraitsDraft(job.fields?.traits || []);
                          setExperienceLevelDraft(job.fields?.experienceLevel || '');
                          setEditingField(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="block text-xs font-medium text-muted-text mb-1">
                        Experience Level
                      </span>
                      <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs text-gray-700 capitalize">
                        {job.fields?.experienceLevel || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-muted-text mb-1">
                        Required Skills
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(job.fields?.skills || []).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-muted-text mb-1">
                        Desired Traits
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(job.fields?.traits || []).map((trait: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info Section (Custom Fields) */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-4">
                <div className="flex items-center justify-between mb-4 md:mb-2">
                  <h2 className="text-lg md:text-base font-semibold text-text">
                    Additional Information
                  </h2>
                  {job.status === 'draft' && editingField === null && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCustomFieldsDraft(
                          job.fields?.customFields
                            ? Object.entries(job.fields.customFields).map(
                                ([key, field]: [string, unknown]) => {
                                  const safeField = field as {
                                    value?: string | number;
                                    inputType?: string;
                                  };
                                  return {
                                    key,
                                    value:
                                      safeField.value !== undefined ? String(safeField.value) : '',
                                    inputType: safeField.inputType || 'text',
                                  };
                                },
                              )
                            : [],
                        );
                        setEditingField('customFields');
                      }}
                    >
                      <PencilIcon className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
                {editingField === 'customFields' ? (
                  <div>
                    {customFieldsDraft.length === 0 && (
                      <div className="text-muted-text text-sm mb-4">
                        No additional information. Add a field below.
                      </div>
                    )}
                    <div className="space-y-4">
                      {customFieldsDraft.map((field, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-light rounded-lg"
                        >
                          <div>
                            <label className="block text-xs font-medium text-muted-text mb-1">
                              Field Name
                            </label>
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => {
                                const updated = [...customFieldsDraft];
                                updated[idx].key = e.target.value;
                                setCustomFieldsDraft(updated);
                              }}
                              placeholder="e.g., Languages spoken"
                              className="w-full px-3 py-2 border border-gray-light rounded text-text placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-text mb-1">
                              Input Type
                            </label>
                            <select
                              value={field.inputType}
                              onChange={(e) => {
                                const updated = [...customFieldsDraft];
                                updated[idx].inputType = e.target.value;
                                setCustomFieldsDraft(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-light rounded text-text focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                            >
                              {inputTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-text mb-1">
                              Description/Placeholder
                            </label>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => {
                                const updated = [...customFieldsDraft];
                                updated[idx].value = e.target.value;
                                setCustomFieldsDraft(updated);
                              }}
                              placeholder="Describe what you're looking for"
                              className="w-full px-3 py-2 border border-gray-light rounded text-text placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCustomFieldsDraft(customFieldsDraft.filter((_, i) => i !== idx))
                              }
                              className="text-accent-red border-accent-red hover:bg-accent-red hover:text-white w-full"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        setCustomFieldsDraft([
                          ...customFieldsDraft,
                          { key: '', value: '', inputType: 'text' },
                        ])
                      }
                    >
                      Add Field
                    </Button>
                    <div className="flex gap-2 mt-6">
                      <Button
                        size="sm"
                        isLoading={isSavingCustomFields}
                        onClick={async () => {
                          setIsSavingCustomFields(true);
                          try {
                            // Convert array to object
                            const customFieldsObj = customFieldsDraft.reduce(
                              (acc, field) => {
                                if (field.key.trim()) {
                                  acc[field.key] = {
                                    value: field.value,
                                    inputType: field.inputType,
                                  };
                                }
                                return acc;
                              },
                              {} as Record<string, { value: string; inputType: string }>,
                            );
                            await dispatch(
                              updateJob({
                                id: job.id,
                                fields: {
                                  ...job.fields,
                                  customFields: customFieldsObj,
                                },
                              }),
                            ).unwrap();
                            apiSuccess('Additional information updated');
                            setEditingField(null);
                          } catch {
                            apiError('Failed to update additional information');
                          } finally {
                            setIsSavingCustomFields(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {job.fields?.customFields && Object.keys(job.fields.customFields).length > 0 ? (
                      Object.entries(job.fields.customFields).map(
                        ([key, field]: [string, unknown]) => (
                          <div key={key} className="mb-2">
                            <span className="font-medium text-sm text-gray-700">{key}</span>
                            <div className="text-xs text-gray-600">
                              {(field as { value?: string | number })?.value || 'No value'}
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <span className="text-muted-text text-sm">
                        No additional information provided.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Job Description Section (already inline editable) */}
              <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-4">
                <div className="flex items-center justify-between mb-3 md:mb-1">
                  <h3 className="text-lg md:text-base font-semibold text-gray-900">
                    Job Description
                  </h3>
                  {job.status === 'draft' && editingField !== 'jobDescription' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingField('jobDescription')}
                    >
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
                            await dispatch(
                              updateJob({
                                id: job.id,
                                fields: {
                                  ...job.fields,
                                  jobDescription: jobDescriptionDraft,
                                },
                              }),
                            ).unwrap();
                            apiSuccess('Job description updated');
                            setEditingField(null);
                          } catch {
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
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        job.fields?.jobDescription ||
                        '<span class=\"text-muted-text\">No description provided.</span>',
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            children
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-2">
          {/* Job Info (read-only summary) */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 md:p-3">
            <h3 className="text-sm md:text-xs font-semibold text-gray-900 mb-3 md:mb-2">
              Job Information
            </h3>
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
            <div className="bg-white rounded-lg border border-gray-100 p-4 md:p-3">
              <h3 className="text-sm md:text-xs font-semibold text-gray-900 mb-3 md:mb-2">
                Required Skills
              </h3>
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
