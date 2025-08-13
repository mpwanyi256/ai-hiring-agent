'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/store';
import { createContract, updateContract, createJobTitle } from '@/store/contracts/contractsThunks';
import { fetchJobTitles, fetchEmploymentTypes } from '@/store/jobs/jobsThunks';
import { selectContractsError } from '@/store/contracts/contractsSelectors';
import { selectJobTitles, selectEmploymentTypes } from '@/store/jobs/jobsSelectors';
import { useAppSelector } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DialogTrigger } from '@/components/ui/dialog';
import {
  Contract,
  CreateContractData,
  UpdateContractData,
  ContractStatus,
  ContractCategory,
} from '@/types/contracts';

import { Loader2, Plus, Sparkles, Building2, FileText, X, Upload, Save } from 'lucide-react';
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
import ComboboxWithCreate from '@/components/ui/ComboboxWithCreate';
import AddJobTitleModal from './AddJobTitleModal';

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
  // categories removed from create form

  // Rich text editor ref
  const editorRef = useRef<RichTextEditorRef>(null);

  // Add mounted state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    body: string;
    jobTitleId: string;
    status: ContractStatus;
  }>({
    title: contract?.title || '',
    body: contract?.content || '',
    jobTitleId: contract?.jobTitleId || '',
    status: contract?.status || 'draft',
  });

  // Modal states
  const [showJobTitleModal, setShowJobTitleModal] = useState(false);
  const [showAiGenerationModal, setShowAiGenerationModal] = useState(false);
  const [showUploadContractModal, setShowUploadContractModal] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [newJobTitleName, setNewJobTitleName] = useState('');
  const [isCreatingJobTitle, setIsCreatingJobTitle] = useState(false);
  // tags removed
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data after component mounts and fetch options
  useEffect(() => {
    setMounted(true);

    // Fetch job titles and employment types
    dispatch(fetchJobTitles());
    dispatch(fetchEmploymentTypes());
    // dispatch(fetchContractCategories()); // categories removed from create form

    // Update form data when contract prop changes (for edit mode)
    if (contract) {
      setFormData({
        title: contract.title || '',
        body: contract.content || '',
        jobTitleId: contract.jobTitleId || '',
        status: contract.status || 'draft',
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
          content: formData.body.trim(),
          jobTitleId: formData.jobTitleId || undefined,
          status: formData.status as 'draft' | 'active',
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
          content: formData.body.trim(),
          jobTitleId: formData.jobTitleId || undefined,
          status: formData.status as 'draft' | 'active' | 'archived',
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

  // tags removed

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
            {/* Responsive 3-column row: Template Name, Job Title, Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Template Title - searchable combobox */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Template Name *
                </Label>
                <Input
                  placeholder="e.g., Software Developer Contract"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <ComboboxWithCreate
                  options={(jobTitles || []).map((j) => ({ id: j.id, name: j.name }))}
                  value={formData.jobTitleId}
                  onChange={(value) =>
                    handleInputChange('jobTitleId', value === 'none' ? '' : value)
                  }
                  onCreateNew={async (name) => {
                    const created = await dispatch(createJobTitle(name as any));
                    // Refresh list and select newly created if available
                    await dispatch(fetchJobTitles());
                    const payload: any = (created as any).payload;
                    const newId = payload?.id || payload?.jobTitle?.id;
                    if (newId) handleInputChange('jobTitleId', newId);
                  }}
                  placeholder="Select or create job title"
                  label="Job Title"
                  createLabel="Add"
                />
                <AddJobTitleModal
                  open={showJobTitleModal}
                  onOpenChange={setShowJobTitleModal}
                  value={newJobTitleName}
                  onValueChange={setNewJobTitleName}
                  onSubmit={handleCreateJobTitle}
                  submitting={isCreatingJobTitle}
                />
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
