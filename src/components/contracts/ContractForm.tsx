'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/store';
import { createContract, updateContract } from '@/store/contracts/contractsThunks';
import { fetchDepartments, fetchJobTitles, fetchEmploymentTypes } from '@/store/jobs/jobsThunks';
import {
  selectIsCreating,
  selectIsUpdating,
  selectContractsError,
} from '@/store/contracts/contractsSelectors';
import {
  selectJobTitles,
  selectJobTitlesLoading,
  selectEmploymentTypes,
  selectEmploymentTypesLoading,
} from '@/store/jobs/jobsSelectors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Contract, CreateContractData, UpdateContractData } from '@/types/contracts';
import { Loader2, Save, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface ContractFormProps {
  contract?: Contract;
  mode: 'create' | 'edit';
}

export default function ContractForm({ contract, mode }: ContractFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isCreating = useSelector(selectIsCreating);
  const isUpdating = useSelector(selectIsUpdating);
  const error = useSelector(selectContractsError);

  // Job-related selectors
  const jobTitles = useSelector(selectJobTitles);
  const jobTitlesLoading = useSelector(selectJobTitlesLoading);
  const employmentTypes = useSelector(selectEmploymentTypes);
  const employmentTypesLoading = useSelector(selectEmploymentTypesLoading);

  // Add mounted state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    jobTitleId: '',
    employmentTypeId: '',
    contractDuration: '',
  });

  // Search states for dropdowns
  const [jobTitleSearch, setJobTitleSearch] = useState('');
  const [employmentTypeSearch, setEmploymentTypeSearch] = useState('');
  const [jobTitleDropdownOpen, setJobTitleDropdownOpen] = useState(false);
  const [employmentTypeDropdownOpen, setEmploymentTypeDropdownOpen] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  // Filtered options
  const filteredJobTitles = jobTitles.filter((jt) =>
    jt.name.toLowerCase().includes(jobTitleSearch.toLowerCase()),
  );
  const filteredEmploymentTypes = employmentTypes.filter((et) =>
    et.name.toLowerCase().includes(employmentTypeSearch.toLowerCase()),
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="job-title"]')) setJobTitleDropdownOpen(false);
      if (!target.closest('[data-dropdown="employment-type"]'))
        setEmploymentTypeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Initialize form data after component mounts and fetch options
  useEffect(() => {
    setMounted(true);

    // Fetch job titles and employment types
    dispatch(fetchJobTitles());
    dispatch(fetchEmploymentTypes());

    if (contract) {
      setFormData({
        title: contract.title || '',
        body: contract.body || '',
        jobTitleId: contract.jobTitleId || '',
        employmentTypeId: contract.employmentTypeId || '',
        contractDuration: contract.contractDuration || '',
      });
    }
  }, [contract, dispatch]);

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      return;
    }

    try {
      if (mode === 'create') {
        const contractData: CreateContractData = {
          title: formData.title.trim(),
          body: formData.body.trim(),
          jobTitleId: formData.jobTitleId || undefined,
          employmentTypeId: formData.employmentTypeId || undefined,
          contractDuration: formData.contractDuration || undefined,
        };

        const result = await dispatch(createContract(contractData));
        if (result.type === 'contracts/createContract/fulfilled') {
          router.push('/dashboard/contracts');
        }
      } else {
        const updateData: UpdateContractData = {
          id: contract!.id,
          title: formData.title.trim(),
          body: formData.body.trim(),
          jobTitleId: formData.jobTitleId || undefined,
          employmentTypeId: formData.employmentTypeId || undefined,
          contractDuration: formData.contractDuration || undefined,
        };

        const result = await dispatch(updateContract(updateData));
        if (result.type === 'contracts/updateContract/fulfilled') {
          router.push(`/dashboard/contracts/${contract!.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle rich text editor change
  const handleBodyChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      body: content,
    }));
  };

  // Sample placeholder variables for the contract body
  const placeholderVariables = [
    '{{ candidate_name }}',
    '{{ candidate_email }}',
    '{{ job_title }}',
    '{{ company_name }}',
    '{{ start_date }}',
    '{{ end_date }}',
    '{{ salary_amount }}',
    '{{ salary_currency }}',
    '{{ contract_duration }}',
    '{{ employment_type }}',
  ];

  const insertPlaceholder = (placeholder: string) => {
    // Insert placeholder at the current cursor position in the rich text editor
    const currentContent = formData.body;
    const newContent = currentContent + (currentContent ? ' ' : '') + placeholder;
    handleBodyChange(newContent);
  };

  const defaultTemplate = `<h1>Employment Contract</h1>

<p><strong>Company:</strong> {{ company_name }}</p>
<p><strong>Employee:</strong> {{ candidate_name }}</p>
<p><strong>Email:</strong> {{ candidate_email }}</p>

<h2>Position Details</h2>
<p><strong>Job Title:</strong> {{ job_title }}</p>
<p><strong>Employment Type:</strong> {{ employment_type }}</p>
<p><strong>Start Date:</strong> {{ start_date }}</p>
<p><strong>Contract Duration:</strong> {{ contract_duration }}</p>

<h2>Compensation</h2>
<p><strong>Salary:</strong> {{ salary_amount }} {{ salary_currency }}</p>

<h2>Terms and Conditions</h2>
<p>This employment contract is governed by the laws of [Country/State]. The employee agrees to:</p>
<ul>
  <li>Perform duties to the best of their ability</li>
  <li>Maintain confidentiality of company information</li>
  <li>Comply with company policies and procedures</li>
</ul>

<h2>Signatures</h2>
<p>By signing below, both parties agree to the terms outlined in this contract.</p>

<p><strong>Employee Signature:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>

<p><strong>Company Representative:</strong> _____________________</p>
<p><strong>Date:</strong> _____________________</p>`.trim();

  const loadTemplate = () => {
    handleBodyChange(defaultTemplate);
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contracts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'create' ? 'Create Contract Template' : 'Edit Contract Template'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'Create a reusable contract template with placeholders.'
                : 'Update your contract template.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
              <CardDescription>Basic information about your contract template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Template Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Software Developer Contract"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* Job Title Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                  <div className="relative" data-dropdown="job-title">
                    <Input
                      id="jobTitle"
                      placeholder="Search job titles..."
                      value={jobTitleSearch}
                      onChange={(e) => setJobTitleSearch(e.target.value)}
                      onFocus={() => setJobTitleDropdownOpen(true)}
                      className="w-full"
                    />
                    {jobTitleDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {jobTitlesLoading ? (
                          <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                        ) : filteredJobTitles.length > 0 ? (
                          filteredJobTitles.map((jobTitle) => (
                            <button
                              key={jobTitle.id}
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => {
                                handleInputChange('jobTitleId', jobTitle.id);
                                setJobTitleSearch(jobTitle.name);
                                setJobTitleDropdownOpen(false);
                              }}
                            >
                              {jobTitle.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">No job titles found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.jobTitleId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleInputChange('jobTitleId', '');
                        setJobTitleSearch('');
                      }}
                      className="mt-1"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>

                {/* Employment Type Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type (Optional)</Label>
                  <div className="relative" data-dropdown="employment-type">
                    <Input
                      id="employmentType"
                      placeholder="Search employment types..."
                      value={employmentTypeSearch}
                      onChange={(e) => setEmploymentTypeSearch(e.target.value)}
                      onFocus={() => setEmploymentTypeDropdownOpen(true)}
                      className="w-full"
                    />
                    {employmentTypeDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {employmentTypesLoading ? (
                          <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                        ) : filteredEmploymentTypes.length > 0 ? (
                          filteredEmploymentTypes.map((employmentType) => (
                            <button
                              key={employmentType.id}
                              type="button"
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => {
                                handleInputChange('employmentTypeId', employmentType.id);
                                setEmploymentTypeSearch(employmentType.name);
                                setEmploymentTypeDropdownOpen(false);
                              }}
                            >
                              {employmentType.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No employment types found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.employmentTypeId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleInputChange('employmentTypeId', '');
                        setEmploymentTypeSearch('');
                      }}
                      className="mt-1"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractDuration">Contract Duration (Optional)</Label>
                  <Input
                    id="contractDuration"
                    placeholder="e.g., 12 months, Permanent"
                    value={formData.contractDuration}
                    onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                  />
                </div>

                {/* Contract Body */}
                {!showPreview ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="contract-body">Contract Template *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={loadTemplate}>
                        Load Default Template
                      </Button>
                    </div>
                    <RichTextEditor
                      content={formData.body}
                      onChange={handleBodyChange}
                      placeholder="Enter your contract template here. Use the rich text editor for formatting and click placeholders from the sidebar to insert dynamic content."
                      className="min-h-[400px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use the toolbar for formatting and click placeholders from the sidebar to
                      insert dynamic content.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Contract Preview</Label>
                    <div
                      className="border rounded-md p-4 min-h-[400px] bg-background prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formData.body || '<p>No content to preview</p>',
                      }}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {mode === 'create' ? 'Create Template' : 'Update Template'}
                  </Button>
                  <Link href="/dashboard/contracts">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Placeholder Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Available Placeholders</CardTitle>
              <CardDescription>
                Click to insert these placeholders into your contract.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {placeholderVariables.map((placeholder) => (
                  <Button
                    key={placeholder}
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder)}
                    className="justify-start font-mono text-xs"
                    type="button"
                  >
                    {placeholder}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <strong>Placeholders:</strong> Use double curly braces like{' '}
                <code>{'{{ candidate_name }}'}</code> for dynamic content.
              </div>
              <div>
                <strong>Rich Text:</strong> Use the toolbar for formatting like headings, lists,
                bold, and italic text.
              </div>
              <div>
                <strong>Preview:</strong> Use the preview mode to see how your contract will look
                when rendered.
              </div>
              <div>
                <strong>Job Integration:</strong> Select job titles and employment types to
                automatically link this template to specific roles.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
