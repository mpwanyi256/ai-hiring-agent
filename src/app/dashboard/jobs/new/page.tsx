'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  createJob,
  fetchDepartments,
  fetchJobTitles,
  fetchEmploymentTypes,
  createDepartment,
  createJobTitle,
  createEmploymentType,
} from '@/store/jobs/jobsThunks';
import { fetchSkills, createSkill } from '@/store/skills/skillsThunks';
import { fetchTraits, createTrait } from '@/store/traits/traitsThunks';
import { fetchJobTemplates } from '@/store/jobTemplates/jobTemplatesThunks';
import { selectSkillsData } from '@/store/skills/skillsSelectors';
import { selectTraitsData } from '@/store/traits/traitsSelectors';
import {
  selectDepartments,
  selectDepartmentsLoading,
  selectJobTitles,
  selectJobTitlesLoading,
  selectEmploymentTypes,
  selectEmploymentTypesLoading,
} from '@/store/jobs/jobsSelectors';
import { useAppDispatch, useAppSelector } from '@/store';
import { WorkplaceType, JobType, CreateJobPayload } from '@/types/jobs';
import JobCreateStep1 from '@/components/forms/JobCreateStep1';
import JobCreateStep2 from '@/components/forms/JobCreateStep2';
import ExperienceRequirementsStep from '@/components/forms/ExperienceRequirementsStep';
import { marked } from 'marked';
import { defaultJobDescriptionMarkdown } from '@/lib/constants';
import { experienceLevels } from '@/lib/constants';
import { JobFormData, jobSchema } from '@/types/jobs';
import { apiError, apiSuccess } from '@/lib/notification';
import Modal from '@/components/ui/Modal';
import AIGenerationLoader from '@/components/ui/AIGenerationLoader';
import { selectUser } from '@/store/auth/authSelectors';
import { useAnalytics } from '@/hooks/useAnalytics';

const workplaceTypes: { value: WorkplaceType; label: string }[] = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];
const jobTypes: { value: JobType; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' },
];

export default function NewJobPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  // Initialize analytics tracking
  const analytics = useAnalytics();

  // Store selectors
  const allSkills = useAppSelector(selectSkillsData);
  const allTraits = useAppSelector(selectTraitsData);

  // Step state
  const [step, setStep] = useState(1);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Redux selectors for dropdowns
  const departments = useAppSelector(selectDepartments);
  const departmentsLoading = useAppSelector(selectDepartmentsLoading);
  const jobTitles = useAppSelector(selectJobTitles);
  const jobTitlesLoading = useAppSelector(selectJobTitlesLoading);
  const employmentTypes = useAppSelector(selectEmploymentTypes);
  const employmentTypesLoading = useAppSelector(selectEmploymentTypesLoading);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [traitDropdownOpen, setTraitDropdownOpen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Add state for search inputs
  const [jobTitleSearch, setJobTitleSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [employmentTypeSearch, setEmploymentTypeSearch] = useState('');
  const [jobTitleDropdownOpen, setJobTitleDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [employmentTypeDropdownOpen, setEmploymentTypeDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="job-title"]')) setJobTitleDropdownOpen(false);
      if (!target.closest('[data-dropdown="department"]')) setDepartmentDropdownOpen(false);
      if (!target.closest('[data-dropdown="employment-type"]'))
        setEmploymentTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Form setup
  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      skills: [],
      experienceLevel: '',
      traits: [],
      interviewFormat: 'text',
      jobDescription: marked.parse(defaultJobDescriptionMarkdown) as string,
      jobDescriptionUrl: '',
      customFields: [],
      saveAsTemplate: false,
      templateName: '',
      jobTitleId: '',
      departmentId: '',
      employmentTypeId: '',
      workplaceType: '',
      jobType: '',
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: 'USD',
      salaryPeriod: 'yearly',
    },
  });

  const {
    fields: customFields,
    append: appendCustomField,
    remove: removeCustomField,
  } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Close skills dropdown if clicking outside
      if (skillDropdownOpen && !target.closest('[data-dropdown="skills"]')) {
        setSkillDropdownOpen(false);
      }

      // Close traits dropdown if clicking outside
      if (traitDropdownOpen && !target.closest('[data-dropdown="traits"]')) {
        setTraitDropdownOpen(false);
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
          dispatch(fetchJobTemplates(user?.id || '')),
          dispatch(fetchDepartments()),
          dispatch(fetchJobTitles()),
          dispatch(fetchEmploymentTypes()),
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        apiError('Failed to load data. Please refresh the page and try again.');
      }
    };

    fetchData();
  }, [dispatch, user]);

  // Check usage limits and subscription validity
  useEffect(() => {
    if (!user?.subscription || !['active', 'trialing'].includes(user.subscription.status)) {
      setIsOverLimit(true);
      setShowSubscriptionModal(true);
    } else if (
      user.subscription.maxJobs !== -1 &&
      user.usageCounts.activeJobs >= user.subscription.maxJobs
    ) {
      setIsOverLimit(true);
      setShowSubscriptionModal(true);
    } else {
      setIsOverLimit(false);
      setShowSubscriptionModal(false);
    }
  }, [user]);

  // Handle form submission
  const onSubmit = async (data: JobFormData) => {
    if (isOverLimit) {
      setShowSubscriptionModal(true);
      apiError(
        !user?.subscription || !['active', 'trialing'].includes(user.subscription?.status)
          ? 'You need an active subscription to create a job. Please subscribe to a plan.'
          : 'You have reached your job posting limit. Please upgrade your plan to create more jobs.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Initiating job creation', data);

      const jobTitle = jobTitles.find((jt) => jt.id === data.jobTitleId);

      // Format the job data
      const jobData: CreateJobPayload = {
        title: jobTitle?.name || 'New job',
        fields: {
          skills: data.skills && data.skills.length > 0 ? data.skills : undefined,
          experienceLevel: data.experienceLevel || undefined,
          traits: data.traits && data.traits.length > 0 ? data.traits : undefined,
          jobDescription: data.jobDescription,
          customFields:
            data.customFields && data.customFields.length > 0
              ? data.customFields.reduce(
                  (acc, field) => {
                    acc[field.key] = {
                      value: field.value,
                      inputType: field.inputType,
                    };
                    return acc;
                  },
                  {} as Record<string, { value: string; inputType: string }>,
                )
              : undefined,
        },
        interviewFormat: data.interviewFormat,
        departmentId: data.departmentId,
        jobTitleId: data.jobTitleId,
        employmentTypeId: data.employmentTypeId,
        workplaceType: data.workplaceType,
        jobType: data.jobType,
        saveAsTemplate: !!data.saveAsTemplate,
        templateName: data.templateName,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        salaryCurrency: data.salaryCurrency || 'USD',
        salaryPeriod: data.salaryPeriod || 'yearly',
      };

      // Create the job
      const job = await dispatch(createJob(jobData)).unwrap();

      // Track job creation success
      analytics.trackJobCreation(data.jobType || 'unknown', 'manual');

      // Show success message and start AI generation
      apiSuccess('Job created successfully! Generating interview questions...');
      setIsSubmitting(false);
      setIsGeneratingQuestions(true);

      // Generate questions (this is already handled in the thunk)
      // The thunk automatically calls generateJobQuestions after creating the job

      // Wait a moment to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to the new job page
      router.push(`/dashboard/jobs/${job.id}`);
    } catch (error) {
      console.error('Failed to create job:', error);
      apiError('Failed to create job. Please try again.');
      setIsSubmitting(false);
      setIsGeneratingQuestions(false);
    }
  };

  // Create handlers
  const handleCreateJobTitle = async (name: string) => {
    try {
      await dispatch(createJobTitle(name)).unwrap();
      // Refresh the list
      await dispatch(fetchJobTitles());
    } catch (error) {
      console.error('Failed to create job title:', error);
      apiError('Failed to create job title. Please try again.');
    }
  };

  const handleCreateDepartment = async (name: string) => {
    try {
      await dispatch(createDepartment(name)).unwrap();
      // Refresh the list
      await dispatch(fetchDepartments());
    } catch (error) {
      console.error('Failed to create department:', error);
      apiError('Failed to create department. Please try again.');
    }
  };

  const handleCreateEmploymentType = async (name: string) => {
    try {
      await dispatch(createEmploymentType(name)).unwrap();
      // Refresh the list
      await dispatch(fetchEmploymentTypes());
    } catch (error) {
      console.error('Failed to create employment type:', error);
      apiError('Failed to create employment type. Please try again.');
    }
  };

  const handleCreateSkill = async (name: string) => {
    try {
      await dispatch(createSkill({ name })).unwrap();
      // Refresh the list
      await dispatch(fetchSkills());
    } catch (error) {
      console.error('Failed to create skill:', error);
      apiError('Failed to create skill. Please try again.');
    }
  };

  const handleCreateTrait = async (name: string) => {
    try {
      await dispatch(createTrait({ name })).unwrap();
      // Refresh the list
      await dispatch(fetchTraits());
    } catch (error) {
      console.error('Failed to create trait:', error);
      apiError('Failed to create trait. Please try again.');
    }
  };

  if (!user) return null; // DashboardLayout handles loading/auth

  // Step 1: Basic Job Details
  const renderStep1 = () => (
    <JobCreateStep1
      form={form}
      jobTitles={jobTitles}
      jobTitlesLoading={jobTitlesLoading}
      jobTitleSearch={jobTitleSearch}
      setJobTitleSearch={setJobTitleSearch}
      jobTitleDropdownOpen={jobTitleDropdownOpen}
      setJobTitleDropdownOpen={setJobTitleDropdownOpen}
      departments={departments}
      departmentsLoading={departmentsLoading}
      departmentSearch={departmentSearch}
      setDepartmentSearch={setDepartmentSearch}
      departmentDropdownOpen={departmentDropdownOpen}
      setDepartmentDropdownOpen={setDepartmentDropdownOpen}
      employmentTypes={employmentTypes}
      employmentTypesLoading={employmentTypesLoading}
      employmentTypeSearch={employmentTypeSearch}
      setEmploymentTypeSearch={setEmploymentTypeSearch}
      employmentTypeDropdownOpen={employmentTypeDropdownOpen}
      setEmploymentTypeDropdownOpen={setEmploymentTypeDropdownOpen}
      workplaceTypes={workplaceTypes}
      jobTypes={jobTypes}
      onNext={() => setStep(2)}
      onCreateJobTitle={handleCreateJobTitle}
      onCreateDepartment={handleCreateDepartment}
      onCreateEmploymentType={handleCreateEmploymentType}
    />
  );

  // Step 2: Experience & Requirements
  const renderStep2 = () => (
    <ExperienceRequirementsStep
      form={form}
      allSkills={allSkills}
      allTraits={allTraits}
      experienceLevels={experienceLevels}
      onPrev={() => setStep(1)}
      onNext={() => setStep(3)}
      onCreateSkill={handleCreateSkill}
      onCreateTrait={handleCreateTrait}
    />
  );

  // Step 3: Description & Requirements
  const appendCustomFieldTyped = (field: { key: string; value: string; inputType: string }) => {
    appendCustomField({
      ...field,
      inputType: field.inputType as 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email',
    });
  };
  const renderStep3 = () => (
    <JobCreateStep2
      form={form}
      customFields={customFields}
      appendCustomField={appendCustomFieldTyped}
      removeCustomField={removeCustomField}
      onPrev={() => setStep(2)}
      onNext={() => onSubmit(form.getValues())}
      isSubmitting={isSubmitting}
    />
  );

  return (
    <DashboardLayout title="Create New Job">
      <div className="max-w-4xl mx-auto">
        {/* Subscription/Limit Modal */}
        <Modal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          title="Subscription Required"
        >
          <div className="mb-4">
            {!user?.subscription || !['active', 'trialing'].includes(user.subscription?.status) ? (
              <>
                <p className="text-red-600 mb-2 font-medium">
                  You need an active subscription to create a job.
                </p>
                <p className="mb-2">
                  Please subscribe to a plan to unlock job creation and other features.
                </p>
              </>
            ) : (
              <>
                <p className="text-red-600 mb-2 font-medium">
                  You have reached your job posting limit for your current plan.
                </p>
                <p className="mb-2">Upgrade your plan to create more jobs.</p>
              </>
            )}
            <a
              href="/pricing"
              className="inline-block mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              View Plans
            </a>
          </div>
        </Modal>

        {/* AI Generation Modal */}
        <Modal
          isOpen={isGeneratingQuestions}
          onClose={() => {}}
          title="Generating Interview Questions"
        >
          <AIGenerationLoader
            message="Creating personalized interview questions..."
            submessage="This process may take a few moments"
            size="lg"
          />
        </Modal>

        {/* Stepper UI */}
        <div className="flex items-center justify-center mb-8 gap-4 text-[14px]">
          <div
            className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            1. Details
          </div>
          <div className="h-0.5 w-8 bg-gray-300" />
          <div
            className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            2. Requirements
          </div>
          <div className="h-0.5 w-8 bg-gray-300" />
          <div
            className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            3. Description
          </div>
        </div>
        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </DashboardLayout>
  );
}
