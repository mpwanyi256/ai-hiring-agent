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
import { fetchDepartments, fetchJobTitles, fetchEmploymentTypes } from '@/store/jobs/jobsThunks';
import { selectSkillsData, selectSkillsLoading } from '@/store/skills/skillsSelectors';
import { selectTraitsData, selectTraitsLoading } from '@/store/traits/traitsSelectors';
import {
  selectJobTemplatesData,
  selectJobTemplatesLoading,
} from '@/store/jobTemplates/jobTemplatesSelectors';
import {
  selectDepartments,
  selectDepartmentsLoading,
  selectJobTitles,
  selectJobTitlesLoading,
  selectEmploymentTypes,
  selectEmploymentTypesLoading,
} from '@/store/jobs/jobsSelectors';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import { JobTemplate } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { WorkplaceType, JobType } from '@/types/jobs';
import JobCreateStep1 from '@/components/forms/JobCreateStep1';
import JobCreateStep2 from '@/components/forms/JobCreateStep2';
import JobCreateStep3 from '@/components/forms/JobCreateStep3';
import { marked } from 'marked';
import { defaultJobDescriptionMarkdown } from '@/lib/constants';

// Enhanced form validation schema
import { JobFormData, jobSchema } from '@/types/jobs';

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
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { isLoading: jobsLoading, error } = useAppSelector((state) => state.jobs);
  const { success, error: showError, info } = useToast();

  // Store selectors
  const allSkills = useAppSelector(selectSkillsData);
  const skillsLoading = useAppSelector(selectSkillsLoading);
  const allTraits = useAppSelector(selectTraitsData);
  const traitsLoading = useAppSelector(selectTraitsLoading);
  const jobTemplates = useAppSelector(selectJobTemplatesData);
  const templatesLoading = useAppSelector(selectJobTemplatesLoading);

  // Step state
  const [step, setStep] = useState(1);

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
  const [skillSearch, setSkillSearch] = useState('');
  const [traitSearch, setTraitSearch] = useState('');

  // Add state for search inputs
  const [jobTitleSearch, setJobTitleSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [employmentTypeSearch, setEmploymentTypeSearch] = useState('');
  const [jobTitleDropdownOpen, setJobTitleDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [employmentTypeDropdownOpen, setEmploymentTypeDropdownOpen] = useState(false);

  // Filtered options
  const filteredJobTitles = jobTitles.filter((jt) =>
    jt.name.toLowerCase().includes(jobTitleSearch.toLowerCase()),
  );
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(departmentSearch.toLowerCase()),
  );
  const filteredEmploymentTypes = employmentTypes.filter((et) =>
    et.name.toLowerCase().includes(employmentTypeSearch.toLowerCase()),
  );

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

  const selectedSkills = form.watch('skills') || [];
  const selectedTraits = form.watch('traits') || [];
  const saveAsTemplate = form.watch('saveAsTemplate');

  // Determine loading state
  const isLoadingData = skillsLoading || traitsLoading || templatesLoading;

  // Filter out selected skills and traits
  const availableSkills = allSkills.filter(
    (skill) =>
      !selectedSkills.includes(skill.name) &&
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const availableTraits = allTraits.filter(
    (trait) =>
      !selectedTraits.includes(trait.name) &&
      trait.name.toLowerCase().includes(traitSearch.toLowerCase()),
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
          dispatch(fetchJobTemplates(user?.id || '')),
          dispatch(fetchDepartments()),
          dispatch(fetchJobTitles()),
          dispatch(fetchEmploymentTypes()),
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        showError('Failed to load data. Please refresh the page and try again.');
      }
    };

    fetchData();
  }, [dispatch, showError, user]);

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
    form.setValue(
      'skills',
      selectedSkills.filter((skill) => skill !== skillToRemove),
    );
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
    form.setValue(
      'traits',
      selectedTraits.filter((trait) => trait !== traitToRemove),
    );
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
      const customFieldsArray = Object.entries(template.fields.customFields).map(
        ([key, fieldData]) => {
          const inputType = (fieldData as { inputType?: string }).inputType || 'text';
          const validInputType = ['text', 'textarea', 'number', 'file', 'url', 'email'].includes(
            inputType,
          )
            ? (inputType as 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email')
            : ('text' as const);

          return {
            key,
            value: fieldData.value || (typeof fieldData === 'string' ? fieldData : ''),
            inputType: validInputType,
          };
        },
      );

      // Clear existing fields and add template fields
      while (customFields.length > 0) {
        removeCustomField(0);
      }
      customFieldsArray.forEach((field) => appendCustomField(field));
    }

    success(`Template "${template.name}" loaded successfully!`);
  };

  // Save template function
  const saveTemplate = async (
    templateName: string,
    jobData: { title: string; fields: Record<string, unknown>; interviewFormat: string },
  ) => {
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
        await dispatch(fetchJobTemplates(user?.id || ''));
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
      showError(
        'You have reached your job posting limit. Please upgrade your plan to create more jobs.',
      );
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
      filteredJobTitles={filteredJobTitles}
      departments={departments}
      departmentsLoading={departmentsLoading}
      departmentSearch={departmentSearch}
      setDepartmentSearch={setDepartmentSearch}
      departmentDropdownOpen={departmentDropdownOpen}
      setDepartmentDropdownOpen={setDepartmentDropdownOpen}
      filteredDepartments={filteredDepartments}
      employmentTypes={employmentTypes}
      employmentTypesLoading={employmentTypesLoading}
      employmentTypeSearch={employmentTypeSearch}
      setEmploymentTypeSearch={setEmploymentTypeSearch}
      employmentTypeDropdownOpen={employmentTypeDropdownOpen}
      setEmploymentTypeDropdownOpen={setEmploymentTypeDropdownOpen}
      filteredEmploymentTypes={filteredEmploymentTypes}
      workplaceTypes={workplaceTypes}
      jobTypes={jobTypes}
      onNext={() => setStep(2)}
    />
  );

  // Step 2: Description & Requirements
  const appendCustomFieldTyped = (field: { key: string; value: string; inputType: string }) => {
    appendCustomField({
      ...field,
      inputType: field.inputType as 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email',
    });
  };
  const renderStep2 = () => (
    <JobCreateStep2
      form={form}
      customFields={customFields}
      appendCustomField={appendCustomFieldTyped}
      removeCustomField={removeCustomField}
      onPrev={() => setStep(1)}
      onNext={() => setStep(3)}
      isSubmitting={isSubmitting}
    />
  );

  // Step 3: Screening Questions
  const renderStep3 = () => (
    <JobCreateStep3
      onPrev={() => setStep(2)}
      onFinish={form.handleSubmit(onSubmit)}
      // jobId can be passed if available after job creation
    />
  );

  return (
    <DashboardLayout title="Create New Job">
      <div className="max-w-4xl mx-auto">
        {/* Stepper UI */}
        <div className="flex items-center justify-center mb-8 gap-4 text-[14px]">
          <div
            className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            1. Basic Details
          </div>
          <div className="h-0.5 w-8 bg-gray-300" />
          <div
            className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            2. Description & Requirements
          </div>
          <div className="h-0.5 w-8 bg-gray-300" />
          <div
            className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            3. Screening Questions
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
