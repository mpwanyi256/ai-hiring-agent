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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Contract, CreateContractData, UpdateContractData } from '@/types/contracts';
import {
  Loader2,
  Save,
  ArrowLeft,
  Eye,
  Plus,
  Sparkles,
  Building2,
  Clock,
  FileText,
  Lightbulb,
} from 'lucide-react';
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

  // Modal states
  const [showJobTitleModal, setShowJobTitleModal] = useState(false);
  const [showAiGenerationModal, setShowAiGenerationModal] = useState(false);
  const [newJobTitleName, setNewJobTitleName] = useState('');
  const [isCreatingJobTitle, setIsCreatingJobTitle] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);

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

  // Handle creating new job title
  const handleCreateJobTitle = async () => {
    if (!newJobTitleName.trim()) return;

    setIsCreatingJobTitle(true);
    try {
      const response = await fetch('/api/job-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newJobTitleName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh job titles
        dispatch(fetchJobTitles());

        // Select the new job title
        handleInputChange('jobTitleId', data.jobTitle.id);
        setJobTitleSearch(data.jobTitle.name);

        // Close modal and reset form
        setShowJobTitleModal(false);
        setNewJobTitleName('');
      } else {
        console.error('Error creating job title:', data.error);
      }
    } catch (error) {
      console.error('Error creating job title:', error);
    } finally {
      setIsCreatingJobTitle(false);
    }
  };

  // Handle AI contract generation
  const handleAiGeneration = async () => {
    if (!aiPrompt.trim()) return;

    setIsGeneratingContract(true);
    try {
      // This would call your AI service to generate contract content
      // For now, we'll simulate the generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const selectedJobTitle = jobTitles.find((jt) => jt.id === formData.jobTitleId);
      const selectedEmploymentType = employmentTypes.find(
        (et) => et.id === formData.employmentTypeId,
      );

      const generatedContract = `<h1>Employment Contract</h1>

<p><strong>Company:</strong> {{ company_name }}</p>
<p><strong>Employee:</strong> {{ candidate_name }}</p>
<p><strong>Email:</strong> {{ candidate_email }}</p>

<h2>Position Details</h2>
<p><strong>Job Title:</strong> ${selectedJobTitle?.name || '{{ job_title }}'}</p>
<p><strong>Employment Type:</strong> ${selectedEmploymentType?.name || '{{ employment_type }}'}</p>
<p><strong>Start Date:</strong> {{ start_date }}</p>
<p><strong>Contract Duration:</strong> ${formData.contractDuration || '{{ contract_duration }}'}</p>

<h2>Compensation</h2>
<p><strong>Salary:</strong> {{ salary_amount }} {{ salary_currency }}</p>

<h2>AI-Generated Terms Based on Your Requirements</h2>
<p>${aiPrompt}</p>

<h2>Standard Terms and Conditions</h2>
<p>This employment contract is governed by the applicable laws. The employee agrees to:</p>
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
<p><strong>Date:</strong> _____________________</p>`;

      handleBodyChange(generatedContract);
      setShowAiGenerationModal(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating contract:', error);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  // Sample placeholder variables for the contract body
  const placeholderVariables = [
    {
      key: '{{ candidate_name }}',
      label: 'Candidate Name',
      description: 'Full name of the candidate',
    },
    { key: '{{ candidate_email }}', label: 'Candidate Email', description: 'Email address' },
    { key: '{{ job_title }}', label: 'Job Title', description: 'Position title' },
    { key: '{{ company_name }}', label: 'Company Name', description: 'Company name' },
    { key: '{{ start_date }}', label: 'Start Date', description: 'Employment start date' },
    { key: '{{ end_date }}', label: 'End Date', description: 'Contract end date' },
    { key: '{{ salary_amount }}', label: 'Salary Amount', description: 'Salary amount' },
    { key: '{{ salary_currency }}', label: 'Currency', description: 'Salary currency' },
    { key: '{{ contract_duration }}', label: 'Duration', description: 'Contract duration' },
    { key: '{{ employment_type }}', label: 'Employment Type', description: 'Type of employment' },
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
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Details
              </CardTitle>
              <CardDescription>Basic information about your contract template.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Two-Column Layout for Basic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Template Title */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Template Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Software Developer Contract"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Job Title with Add Button */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm font-medium">
                      Job Title (Optional)
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1" data-dropdown="job-title">
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
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No job titles found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Dialog open={showJobTitleModal} onOpenChange={setShowJobTitleModal}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Job Title</DialogTitle>
                            <DialogDescription>
                              Create a new job title for your company. This will be available for
                              future use.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="newJobTitle">Job Title Name</Label>
                              <Input
                                id="newJobTitle"
                                placeholder="e.g., Senior React Developer"
                                value={newJobTitleName}
                                onChange={(e) => setNewJobTitleName(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowJobTitleModal(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreateJobTitle}
                              disabled={isCreatingJobTitle || !newJobTitleName.trim()}
                            >
                              {isCreatingJobTitle ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Create Job Title
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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

                  {/* Employment Type */}
                  <div className="space-y-2">
                    <Label htmlFor="employmentType" className="text-sm font-medium">
                      Employment Type (Optional)
                    </Label>
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

                  {/* Contract Duration */}
                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="contractDuration"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Contract Duration (Optional)
                    </Label>
                    <Input
                      id="contractDuration"
                      placeholder="e.g., 12 months, Permanent"
                      value={formData.contractDuration}
                      onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                    />
                  </div>
                </div>

                {/* Contract Body Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="contract-body" className="text-sm font-medium">
                      Contract Template *
                    </Label>
                    <div className="flex gap-2">
                      <Dialog open={showAiGenerationModal} onOpenChange={setShowAiGenerationModal}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate with AI
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5" />
                              AI Contract Generation
                            </DialogTitle>
                            <DialogDescription>
                              Provide additional details about the contract requirements, and we
                              will generate a customized template based on your selected fields.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Selected Fields Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <h4 className="font-medium text-sm">Selected Fields:</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <strong>Title:</strong> {formData.title || 'Not specified'}
                                </div>
                                <div>
                                  <strong>Job Title:</strong>{' '}
                                  {jobTitles.find((jt) => jt.id === formData.jobTitleId)?.name ||
                                    'Not selected'}
                                </div>
                                <div>
                                  <strong>Employment Type:</strong>{' '}
                                  {employmentTypes.find((et) => et.id === formData.employmentTypeId)
                                    ?.name || 'Not selected'}
                                </div>
                                <div>
                                  <strong>Duration:</strong>{' '}
                                  {formData.contractDuration || 'Not specified'}
                                </div>
                              </div>
                            </div>

                            {/* AI Prompt Input */}
                            <div className="space-y-2">
                              <Label htmlFor="aiPrompt">Additional Requirements & Details</Label>
                              <Textarea
                                id="aiPrompt"
                                placeholder="Describe specific requirements, benefits, responsibilities, or any special terms you want to include in the contract..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                rows={6}
                                className="resize-none"
                              />
                              <p className="text-xs text-muted-foreground">
                                Example: &quot;Include health insurance benefits, flexible working
                                hours, probation period of 3 months, and confidentiality clause for
                                tech company.&quot;
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAiGenerationModal(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleAiGeneration}
                              disabled={isGeneratingContract || !aiPrompt.trim()}
                            >
                              {isGeneratingContract ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                              )}
                              Generate Contract
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button type="button" variant="outline" size="sm" onClick={loadTemplate}>
                        Load Default Template
                      </Button>
                    </div>
                  </div>

                  {!showPreview ? (
                    <div className="space-y-2">
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
                      <div
                        className="border rounded-md p-4 min-h-[400px] bg-background prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formData.body || '<p>No content to preview</p>',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-6 border-t">
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
              <CardTitle className="text-lg">Available Placeholders</CardTitle>
              <CardDescription>
                Click to insert these placeholders into your contract.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {placeholderVariables.map((placeholder) => (
                  <Button
                    key={placeholder.key}
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder.key)}
                    className="justify-start font-mono text-xs h-auto p-3 flex-col items-start"
                    type="button"
                    title={placeholder.description}
                  >
                    <span className="font-mono">{placeholder.key}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {placeholder.label}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="space-y-2">
                <strong>Placeholders:</strong>
                <p className="text-muted-foreground">
                  Use double curly braces like{' '}
                  <code className="bg-muted px-1 rounded">{'{{ candidate_name }}'}</code> for
                  dynamic content.
                </p>
              </div>
              <div className="space-y-2">
                <strong>Rich Text:</strong>
                <p className="text-muted-foreground">
                  Use the toolbar for formatting like headings, lists, bold, and italic text.
                </p>
              </div>
              <div className="space-y-2">
                <strong>Preview:</strong>
                <p className="text-muted-foreground">
                  Use the preview mode to see how your contract will look when rendered.
                </p>
              </div>
              <div className="space-y-2">
                <strong>AI Generation:</strong>
                <p className="text-muted-foreground">
                  Use AI to generate contract templates based on your specific requirements and job
                  details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
