'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/store';
import { createContract, updateContract, createJobTitle } from '@/store/contracts/contractsThunks';
import { fetchJobTitles, fetchEmploymentTypes } from '@/store/jobs/jobsThunks';
import { selectContractsError } from '@/store/contracts/contractsSelectors';
import { selectJobTitles, selectEmploymentTypes } from '@/store/jobs/jobsSelectors';
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
import {
  Contract,
  CreateContractData,
  UpdateContractData,
  ContractStatus,
  ContractCategory,
} from '@/types/contracts';

import {
  Loader2,
  Plus,
  Sparkles,
  Building2,
  Clock,
  FileText,
  TagIcon,
  X,
  Upload,
  Save,
} from 'lucide-react';
import RichTextEditor, { RichTextEditorRef } from '@/components/ui/RichTextEditor';
import AIGenerationModal from './AIGenerationModal';
import ContractPlaceholders from './ContractPlaceholders';
import UploadContractModal from './UploadContractModal';
import ContractRefineModal from './ContractRefineModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ContractFormProps {
  contract?: Contract;
  mode: 'create' | 'edit';
}

export default function ContractForm({ contract, mode }: ContractFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const error = useSelector(selectContractsError);

  // Job-related selectors
  const jobTitles = useSelector(selectJobTitles);
  const employmentTypes = useSelector(selectEmploymentTypes);

  // Rich text editor ref
  const editorRef = useRef<RichTextEditorRef>(null);

  // Add mounted state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    body: string;
    jobTitleId: string;
    employmentTypeId: string;
    contractDuration: string;
    status: ContractStatus;
    category: ContractCategory;
    tags: string[];
  }>({
    title: contract?.title || '',
    body: contract?.body || '',
    jobTitleId: contract?.jobTitleId || '',
    employmentTypeId: contract?.employmentTypeId || '',
    contractDuration: contract?.contractDuration || '',
    status: contract?.status || 'draft',
    category: contract?.category || 'general',
    tags: contract?.tags || [],
  });

  // Modal states
  const [showJobTitleModal, setShowJobTitleModal] = useState(false);
  const [showAiGenerationModal, setShowAiGenerationModal] = useState(false);
  const [showUploadContractModal, setShowUploadContractModal] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [newJobTitleName, setNewJobTitleName] = useState('');
  const [isCreatingJobTitle, setIsCreatingJobTitle] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data after component mounts and fetch options
  useEffect(() => {
    setMounted(true);

    // Fetch job titles and employment types
    dispatch(fetchJobTitles());
    dispatch(fetchEmploymentTypes());

    // Update form data when contract prop changes (for edit mode)
    if (contract) {
      setFormData({
        title: contract.title || '',
        body: contract.body || '',
        jobTitleId: contract.jobTitleId || '',
        employmentTypeId: contract.employmentTypeId || '',
        contractDuration: contract.contractDuration || '',
        status: contract.status || 'draft',
        category: contract.category || 'general',
        tags: contract.tags || [],
      });
    }
  }, [contract, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Please fill in the required fields');
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const contractData: CreateContractData = {
          title: formData.title.trim(),
          body: formData.body.trim(),
          jobTitleId: formData.jobTitleId || undefined,
          employmentTypeId: formData.employmentTypeId || undefined,
          contractDuration: formData.contractDuration || undefined,
          status: formData.status,
          category: formData.category,
          tags: formData.tags,
        };

        const result = await dispatch(createContract(contractData));
        if (result.type === 'contracts/createContract/fulfilled') {
          toast.success('Contract template created successfully');
          router.push('/dashboard/contracts');
        } else {
          toast.error('Failed to create contract template');
        }
      } else {
        const updateData: UpdateContractData = {
          id: contract!.id,
          title: formData.title.trim(),
          body: formData.body.trim(),
          jobTitleId: formData.jobTitleId || undefined,
          employmentTypeId: formData.employmentTypeId || undefined,
          contractDuration: formData.contractDuration || undefined,
          status: formData.status,
          category: formData.category,
          tags: formData.tags,
        };

        const result = await dispatch(updateContract(updateData));
        if (result.type === 'contracts/updateContract/fulfilled') {
          toast.success('Contract template updated successfully');
          router.push('/dashboard/contracts');
        } else {
          toast.error('Failed to update contract template');
        }
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Failed to save contract template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBodyChange = (content: string) => {
    handleInputChange('body', content);
  };

  const handleCreateJobTitle = async () => {
    if (!newJobTitleName.trim()) return;

    setIsCreatingJobTitle(true);
    try {
      const result = await dispatch(createJobTitle({ name: newJobTitleName.trim() }));
      if (result.type === 'contracts/createJobTitle/fulfilled') {
        const payload = result.payload as { jobTitle?: { id: string; name: string } };
        const newJobTitle = payload?.jobTitle;
        if (newJobTitle) {
          handleInputChange('jobTitleId', newJobTitle.id);
          toast.success('Job title created successfully');
        }
        setShowJobTitleModal(false);
        setNewJobTitleName('');
      }
    } catch {
      toast.error('Failed to create job title');
    } finally {
      setIsCreatingJobTitle(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange(
      'tags',
      formData.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleUploadedContent = (content: string) => {
    handleBodyChange(content);
    toast.success('Contract content loaded from uploaded file!');
  };

  const handleRefinedContent = (content: string) => {
    handleBodyChange(content);
    toast.success('Contract template refined successfully!');
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
    <div className="">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form id="contract-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Contract Details Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Contract Details
            </CardTitle>
            <CardDescription>Basic information about your contract template.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Title and Tags - Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Template Title */}
              <div className="space-y-2">
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

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags (Optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Job Title - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium">
                Job Title (Optional)
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.jobTitleId}
                  onValueChange={(value) => handleInputChange('jobTitleId', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select job title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No job title</SelectItem>
                    {(jobTitles || []).map((jobTitle) => (
                      <SelectItem key={jobTitle.id} value={jobTitle.id}>
                        {jobTitle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        Create a new job title for your company.
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
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Contract Duration - Full Width */}
            <div className="space-y-2">
              <Label
                htmlFor="contractDuration"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Duration (Optional)
              </Label>
              <Input
                id="contractDuration"
                placeholder="e.g., 12 months, Permanent"
                value={formData.contractDuration}
                onChange={(e) => handleInputChange('contractDuration', e.target.value)}
              />
            </div>

            {/* Three Column Layout for Employment Type, Category, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employment Type */}
              <div className="space-y-2">
                <Label htmlFor="employmentType" className="text-sm font-medium">
                  Employment Type (Optional)
                </Label>
                <Select
                  value={formData.employmentTypeId}
                  onValueChange={(value) => handleInputChange('employmentTypeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No employment type</SelectItem>
                    {(employmentTypes || []).map((employmentType) => (
                      <SelectItem key={employmentType.id} value={employmentType.id}>
                        {employmentType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Template Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Contract Template *
                </CardTitle>
                <CardDescription>
                  Write your contract template using placeholders like {`{{ candidate_name }}`}.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <ContractPlaceholders
                  onInsertPlaceholder={(placeholder) => {
                    try {
                      if (
                        editorRef.current &&
                        typeof editorRef.current.insertAtCursor === 'function'
                      ) {
                        editorRef.current.insertAtCursor(placeholder);
                      } else {
                        console.warn('Editor ref not available or insertAtCursor method not found');
                        // Fallback: append to current content
                        const currentContent = formData.body || '';
                        handleBodyChange(currentContent + ' ' + placeholder + ' ');
                      }
                    } catch (error) {
                      console.error('Error inserting placeholder:', error);
                      // Fallback: append to current content
                      const currentContent = formData.body || '';
                      handleBodyChange(currentContent + ' ' + placeholder + ' ');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadContractModal(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contract
                </Button>
                {formData.body.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRefineModal(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Refine
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiGenerationModal(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
                <AIGenerationModal
                  open={showAiGenerationModal}
                  onOpenChange={setShowAiGenerationModal}
                  title={formData.title}
                  jobTitleId={formData.jobTitleId}
                  employmentTypeId={formData.employmentTypeId}
                  contractDuration={formData.contractDuration}
                  jobTitles={jobTitles || []}
                  employmentTypes={employmentTypes || []}
                  onSuccess={(content: string) => {
                    handleBodyChange(content);
                    setShowAiGenerationModal(false);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              ref={editorRef}
              content={formData.body}
              onChange={handleBodyChange}
              placeholder="Write your contract template here..."
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {mode === 'create' ? 'Create new contract template' : 'Update contract template'}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.body.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Contract' : 'Update Contract'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Upload Contract Modal */}
      <UploadContractModal
        open={showUploadContractModal}
        onOpenChange={setShowUploadContractModal}
        onContentExtracted={handleUploadedContent}
      />

      {/* Contract Refine Modal */}
      <ContractRefineModal
        open={showRefineModal}
        onOpenChange={setShowRefineModal}
        content={formData.body}
        onContentRefined={handleRefinedContent}
      />
    </div>
  );
}
