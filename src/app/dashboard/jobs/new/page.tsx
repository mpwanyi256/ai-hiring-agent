'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { createJob } from '@/store/jobs/jobsThunks';
import { refreshUserData } from '@/store/auth/authThunks';
import { fetchSkills } from '@/store/skills/skillsThunks';
import { fetchTraits } from '@/store/traits/traitsThunks';
import { fetchJobTemplates } from '@/store/jobTemplates/jobTemplatesThunks';
import { selectSkillsData, selectSkillsLoading } from '@/store/skills/skillsSelectors';
import { selectTraitsData, selectTraitsLoading } from '@/store/traits/traitsSelectors';
import { selectJobTemplatesData, selectJobTemplatesLoading } from '@/store/jobTemplates/jobTemplatesSelectors';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import { JobTemplate } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  BookmarkIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { experienceLevels, inputTypes } from '@/lib/constants';

// Enhanced form validation schema
const jobSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  skills: z.array(z.string().min(1)).optional(),
  experienceLevel: z.string().optional(),
  traits: z.array(z.string().min(1)).optional(),
  interviewFormat: z.enum(['text', 'video']),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  jobDescriptionUrl: z.string().url().optional().or(z.literal('')),
  customFields: z.array(z.object({
    key: z.string().min(1, 'Field name is required'),
    value: z.string().min(1, 'Field value is required'),
    inputType: z.enum(['text', 'textarea', 'number', 'file', 'url', 'email']),
  })).optional(),
  saveAsTemplate: z.boolean().optional(),
  templateName: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isLoading: jobsLoading, error } = useAppSelector((state: RootState) => state.jobs);
  const { success, error: showError, info } = useToast();
  
  // Store selectors
  const allSkills = useAppSelector(selectSkillsData);
  const skillsLoading = useAppSelector(selectSkillsLoading);
  const allTraits = useAppSelector(selectTraitsData);
  const traitsLoading = useAppSelector(selectTraitsLoading);
  const jobTemplates = useAppSelector(selectJobTemplatesData);
  const templatesLoading = useAppSelector(selectJobTemplatesLoading);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [traitDropdownOpen, setTraitDropdownOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [traitSearch, setTraitSearch] = useState('');
  const [isCrawlingUrl, setIsCrawlingUrl] = useState(false);

  // Form setup
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      skills: [],
      experienceLevel: '',
      traits: [],
      interviewFormat: 'text',
      jobDescription: '',
      jobDescriptionUrl: '',
      customFields: [],
      saveAsTemplate: false,
      templateName: '',
    },
  });

  const { fields: customFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  const selectedSkills = form.watch('skills') || [];
  const selectedTraits = form.watch('traits') || [];
  const saveAsTemplate = form.watch('saveAsTemplate');

  // Determine loading state
  const isLoadingData = skillsLoading || traitsLoading || templatesLoading;

  // Filter out selected skills and traits
  const availableSkills = allSkills.filter(skill => 
    !selectedSkills.includes(skill.name) && 
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const availableTraits = allTraits.filter(trait => 
    !selectedTraits.includes(trait.name) && 
    trait.name.toLowerCase().includes(traitSearch.toLowerCase())
  );

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

  // Fetch skills, traits, and templates on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchSkills()),
          dispatch(fetchTraits()),
          dispatch(fetchJobTemplates())
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        showError('Failed to load data. Please refresh the page and try again.');
      }
    };

    fetchData();
  }, [dispatch, showError]);

  // Check usage limits
  useEffect(() => {
    if (user?.subscription && user.usageCounts.activeJobs >= user.subscription.maxJobs) {
      setIsOverLimit(true);
    }
  }, [user]);

  // Handle skill addition
  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      form.setValue('skills', [...selectedSkills, skill]);
      info(`Added skill: ${skill}`);
    }
    setSkillSearch('');
    setSkillDropdownOpen(false);
  };

  const removeSkill = (skillToRemove: string) => {
    form.setValue('skills', selectedSkills.filter(skill => skill !== skillToRemove));
    info(`Removed skill: ${skillToRemove}`);
  };

  // Handle trait addition
  const addTrait = (trait: string) => {
    if (trait && !selectedTraits.includes(trait)) {
      form.setValue('traits', [...selectedTraits, trait]);
      info(`Added trait: ${trait}`);
    }
    setTraitSearch('');
    setTraitDropdownOpen(false);
  };

  const removeTrait = (traitToRemove: string) => {
    form.setValue('traits', selectedTraits.filter(trait => trait !== traitToRemove));
    info(`Removed trait: ${traitToRemove}`);
  };

  // Handle template loading
  const loadTemplate = (template: JobTemplate) => {
    form.setValue('title', template.title);
    form.setValue('skills', template.fields?.skills || []);
    form.setValue('experienceLevel', template.fields?.experienceLevel || '');
    form.setValue('traits', template.fields?.traits || []);
    form.setValue('jobDescription', template.fields?.jobDescription || '');
    form.setValue('interviewFormat', template.interview_format as 'text' | 'video');
    
    // Load custom fields
    if (template.fields?.customFields) {
      const customFieldsArray = Object.entries(template.fields.customFields).map(([key, fieldData]) => {
        const inputType = (fieldData as { inputType?: string }).inputType || 'text';
        const validInputType = ['text', 'textarea', 'number', 'file', 'url', 'email'].includes(inputType) 
          ? inputType as 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email'
          : 'text' as const;
        
        return {
          key,
          value: fieldData.value || (typeof fieldData === 'string' ? fieldData : ''),
          inputType: validInputType,
        };
      });
      
      // Clear existing fields and add template fields
      while (customFields.length > 0) {
        removeCustomField(0);
      }
      customFieldsArray.forEach(field => appendCustomField(field));
    }

    success(`Template "${template.name}" loaded successfully!`);
  };

  // Handle URL crawling
  const crawlJobDescription = async () => {
    const url = form.getValues('jobDescriptionUrl');
    if (!url) {
      showError('Please enter a valid URL');
      return;
    }

    setIsCrawlingUrl(true);
    info('Importing job description from URL...');
    
    try {
      // Simulate API call - replace with actual crawling service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock crawled content
      const mockDescription = `We are seeking a talented ${form.getValues('title') || 'professional'} to join our growing team. 

**Key Responsibilities:**
• Develop and maintain high-quality software solutions
• Collaborate with cross-functional teams to deliver exceptional results
• Participate in code reviews and maintain coding standards
• Contribute to technical discussions and architectural decisions

**Requirements:**
• Strong technical skills and problem-solving abilities
• Excellent communication and collaboration skills
• Experience with modern development practices
• Passion for continuous learning and improvement

**What We Offer:**
• Competitive salary and benefits package
• Flexible working arrangements
• Professional development opportunities
• Collaborative and innovative work environment`;

      form.setValue('jobDescription', mockDescription);
      success('Job description successfully imported from URL!');
    } catch {
      showError('Failed to import job description. Please try again or enter manually.');
    } finally {
      setIsCrawlingUrl(false);
    }
  };

  // Save template function
  const saveTemplate = async (templateName: string, jobData: { title: string; fields: Record<string, unknown>; interviewFormat: string }) => {
    try {
      const response = await fetch('/api/job-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          title: jobData.title,
          fields: jobData.fields,
          interviewFormat: jobData.interviewFormat,
        }),
      });

      if (response.ok) {
        console.log('Template saved successfully');
        success(`Template "${templateName}" saved successfully!`);
        // Refresh templates list using Redux
        await dispatch(fetchJobTemplates());
      } else {
        const errorData = await response.json();
        showError(`Failed to save template: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error saving template:', err);
      showError('Failed to save template. Please try again.');
    }
  };

  // Handle form submission
  const onSubmit = async (data: JobFormData) => {
    if (!user) return;
    
    if (isOverLimit) {
      showError('You have reached your job posting limit. Please upgrade your plan to create more jobs.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the job data
      const jobData = {
        profileId: user.id,
        title: data.title,
        fields: {
          skills: data.skills && data.skills.length > 0 ? data.skills : undefined,
          experienceLevel: data.experienceLevel || undefined,
          traits: data.traits && data.traits.length > 0 ? data.traits : undefined,
          jobDescription: data.jobDescription,
          customFields: data.customFields && data.customFields.length > 0
            ? data.customFields.reduce((acc, field) => {
                acc[field.key] = {
                  value: field.value,
                  inputType: field.inputType
                };
                return acc;
              }, {} as Record<string, { value: string; inputType: string }>)
            : undefined,
        },
        interviewFormat: data.interviewFormat,
      };

      // Save as template if requested
      if (data.saveAsTemplate && data.templateName) {
        await saveTemplate(data.templateName, jobData);
      }

      // Create the job
      await dispatch(createJob(jobData)).unwrap();
      
      // Refresh user data to update usage counts
      await dispatch(refreshUserData()).unwrap();

      // Show success message
      success('Job created successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/dashboard/jobs');
      }, 2000);

    } catch (error) {
      console.error('Failed to create job:', error);
      showError('Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null; // DashboardLayout handles loading/auth

  return (
    <DashboardLayout title="Create New Job">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/jobs')}
              className="flex items-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Create New Job</h1>
          <p className="text-muted-text">
            Set up a new position and start interviewing candidates with AI
          </p>
        </div>

        {/* Loading State */}
        {isLoadingData && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-light rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-muted-text">Loading skills, traits, and templates...</span>
            </div>
          </div>
        )}

        {/* Template Selection */}
        {!isLoadingData && jobTemplates.length > 0 && (
          <div className="mb-8 bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Start from Template</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => loadTemplate(template)}
                  className="p-3 border border-gray-light rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <BookmarkIcon className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-text text-sm truncate">{template.name}</p>
                      <p className="text-muted-text text-xs truncate">{template.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Usage Limit Warning */}
        {isOverLimit && (
          <div className="mb-8 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-accent-red">Job Limit Reached</h3>
                <p className="text-sm text-accent-red mt-1">
                  You have reached your limit of {user.subscription?.maxJobs} active job{user.subscription?.maxJobs !== 1 ? 's' : ''}.
                  Please upgrade your plan to create more jobs.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-accent-red text-accent-red hover:bg-accent-red hover:text-white"
                  onClick={() => router.push('/dashboard/billing')}
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
            <p className="text-accent-red text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text mb-2">
                  Job Title *
                </label>
                <input
                  {...form.register('title')}
                  type="text"
                  id="title"
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {form.formState.errors.title && (
                  <p className="text-accent-red text-sm mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-text mb-2">
                  Experience Level
                </label>
                <select
                  {...form.register('experienceLevel')}
                  id="experienceLevel"
                  className="w-full px-4 py-3 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select experience level (optional)</option>
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interview Format */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Interview Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-4 border border-gray-light rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      {...form.register('interviewFormat')}
                      type="radio"
                      value="text"
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-text">Text-based Interview</p>
                      <p className="text-sm text-muted-text">Chat-style Q&A with AI</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border border-gray-light rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      {...form.register('interviewFormat')}
                      type="radio"
                      value="video"
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-text">Video Interview</p>
                      <p className="text-sm text-muted-text">Async video responses</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-6">Job Description</h2>
            
            <div className="space-y-4">
              {/* URL Input for Crawling */}
              <div>
                <label htmlFor="jobDescriptionUrl" className="block text-sm font-medium text-text mb-2">
                  Import from Job URL (Optional)
                </label>
                <div className="flex space-x-2">
                  <input
                    {...form.register('jobDescriptionUrl')}
                    type="url"
                    id="jobDescriptionUrl"
                    placeholder="https://company.com/careers/job-posting"
                    className="flex-1 px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={crawlJobDescription}
                    disabled={isCrawlingUrl || !form.watch('jobDescriptionUrl')}
                    isLoading={isCrawlingUrl}
                    className="flex items-center px-6"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {isCrawlingUrl ? 'Importing...' : 'Import'}
                  </Button>
                </div>
                {form.formState.errors.jobDescriptionUrl && (
                  <p className="text-accent-red text-sm mt-1">
                    {form.formState.errors.jobDescriptionUrl.message}
                  </p>
                )}
              </div>

              {/* Job Description Text Area */}
              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-text mb-2">
                  Job Description *
                </label>
                <RichTextEditor
                  content={form.watch('jobDescription') || ''}
                  onChange={(content) => form.setValue('jobDescription', content)}
                  placeholder="Describe the role, responsibilities, requirements, and what you offer..."
                  className="w-full"
                />
                {form.formState.errors.jobDescription && (
                  <p className="text-accent-red text-sm mt-1">
                    {form.formState.errors.jobDescription.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-6">Required Skills</h2>
            
            <div className="space-y-4">
              {/* Skills Dropdown */}
              <div className="relative" data-dropdown="skills">
                <label className="block text-sm font-medium text-text mb-2">
                  Add Skills
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSkillDropdownOpen(!skillDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-light rounded-lg text-left text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
                  >
                    <span className="text-muted-text">
                      Search and select skills...
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-muted-text transition-transform ${skillDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {skillDropdownOpen && (
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
                              onClick={() => addSkill(skill.name)}
                              className="w-full px-4 py-3 text-left text-text hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div>
                                <p className="font-medium">{skill.name}</p>
                                {skill.description && (
                                  <p className="text-xs text-muted-text truncate mt-1">{skill.description}</p>
                                )}
                                <p className="text-xs text-primary capitalize mt-1">{skill.category}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-muted-text text-sm text-center">
                            {skillSearch ? 'No skills found matching your search' : 'All skills have been selected'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Skills */}
              {selectedSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text mb-3">Selected Skills ({selectedSkills.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-light">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-primary hover:text-accent-red transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Traits Section */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-6">Desired Traits</h2>
            
            <div className="space-y-4">
              {/* Traits Dropdown */}
              <div className="relative" data-dropdown="traits">
                <label className="block text-sm font-medium text-text mb-2">
                  Add Traits
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTraitDropdownOpen(!traitDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-light rounded-lg text-left text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
                  >
                    <span className="text-muted-text">
                      Search and select traits...
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-muted-text transition-transform ${traitDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {traitDropdownOpen && (
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
                              onClick={() => addTrait(trait.name)}
                              className="w-full px-4 py-3 text-left text-text hover:bg-accent-blue/5 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div>
                                <p className="font-medium">{trait.name}</p>
                                {trait.description && (
                                  <p className="text-xs text-muted-text truncate mt-1">{trait.description}</p>
                                )}
                                <p className="text-xs text-accent-blue capitalize mt-1">{trait.category}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-muted-text text-sm text-center">
                            {traitSearch ? 'No traits found matching your search' : 'All traits have been selected'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Traits */}
              {selectedTraits.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text mb-3">Selected Traits ({selectedTraits.length}):</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-light">
                    {selectedTraits.map((trait) => (
                      <span
                        key={trait}
                        className="inline-flex items-center px-3 py-1.5 bg-accent-blue/10 text-accent-blue rounded-full text-sm font-medium"
                      >
                        {trait}
                        <button
                          type="button"
                          onClick={() => removeTrait(trait)}
                          className="ml-2 text-accent-blue hover:text-accent-red transition-colors"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Custom Fields Section */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text">Custom Fields</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCustomField({ key: '', value: '', inputType: 'text' })}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
            
            {customFields.length === 0 ? (
              <p className="text-muted-text text-sm">
                No custom fields added. You can add additional requirements or questions for candidates.
              </p>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-light rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-muted-text mb-1">Field Name</label>
                      <input
                        {...form.register(`customFields.${index}.key`)}
                        placeholder="e.g., 'Expected Salary'"
                        className="w-full px-3 py-2 border border-gray-light rounded text-text placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                      />
                      {form.formState.errors.customFields?.[index]?.key && (
                        <p className="text-accent-red text-xs mt-1">
                          {form.formState.errors.customFields[index]?.key?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-muted-text mb-1">Input Type</label>
                      <select
                        {...form.register(`customFields.${index}.inputType`)}
                        className="w-full px-3 py-2 border border-gray-light rounded text-text focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                      >
                        {inputTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-muted-text mb-1">Description/Placeholder</label>
                      <input
                        {...form.register(`customFields.${index}.value`)}
                        placeholder="Describe what you're looking for"
                        className="w-full px-3 py-2 border border-gray-light rounded text-text placeholder-muted-text focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                      />
                      {form.formState.errors.customFields?.[index]?.value && (
                        <p className="text-accent-red text-xs mt-1">
                          {form.formState.errors.customFields[index]?.value?.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                        className="text-accent-red border-accent-red hover:bg-accent-red hover:text-white w-full"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Saving */}
          <div className="bg-white rounded-lg border border-gray-light p-6">
            <h2 className="text-lg font-semibold text-text mb-6">Save as Template</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  {...form.register('saveAsTemplate')}
                  type="checkbox"
                  className="rounded border-gray-light text-primary focus:ring-primary"
                />
                <span className="text-text">Save this job configuration as a template for future use</span>
              </label>
              
              {saveAsTemplate && (
                <div>
                  <label htmlFor="templateName" className="block text-sm font-medium text-text mb-2">
                    Template Name
                  </label>
                  <input
                    {...form.register('templateName')}
                    type="text"
                    id="templateName"
                    placeholder="e.g., 'Frontend Developer Template'"
                    className="w-full px-4 py-3 border border-gray-light rounded-lg text-text placeholder-muted-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-light">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/jobs')}
              disabled={isSubmitting}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || jobsLoading}
              disabled={isOverLimit || isLoadingData}
              className="min-w-[140px] sm:w-auto w-full"
            >
              {isSubmitting ? 'Creating...' : saveAsTemplate ? 'Create & Save Template' : 'Create Job'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 