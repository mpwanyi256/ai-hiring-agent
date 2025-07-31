'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { generateContractWithAI } from '@/store/contracts/contractsThunks';
import { selectIsGeneratingAI } from '@/store/contracts/contractsSelectors';
import { selectCompanyDetails } from '@/store/auth/authSelectors';
import { AIGenerateContractData, AIGenerateContractResponse } from '@/types/contracts';
import { JobTitle, EmploymentType } from '@/types/jobs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import AIGenerationLoader, { AILoaderPresets } from '@/components/ui/AIGenerationLoader';

interface AIGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  jobTitleId?: string;
  employmentTypeId?: string;
  contractDuration?: string;
  jobTitles: JobTitle[];
  employmentTypes: EmploymentType[];
  onSuccess: (generatedContent: string) => void;
}

export default function AIGenerationModal({
  open,
  onOpenChange,
  title = '',
  jobTitleId = '',
  employmentTypeId = '',
  contractDuration = '',
  jobTitles,
  employmentTypes,
  onSuccess,
}: AIGenerationModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const isGeneratingAI = useSelector(selectIsGeneratingAI);
  const companyDetails = useSelector(selectCompanyDetails);

  const [aiPrompt, setAiPrompt] = useState('');

  // Get selected details
  const selectedJobTitle = jobTitles.find((jt) => jt.id === jobTitleId);
  const selectedEmploymentType = employmentTypes.find((et) => et.id === employmentTypeId);

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || !companyDetails) return;

    try {
      const aiData: AIGenerateContractData = {
        title,
        jobTitleId,
        employmentTypeId,
        contractDuration,
        userPrompt: aiPrompt.trim(),
        companyId: companyDetails.id,
        companyName: companyDetails.name,
        selectedJobTitle: selectedJobTitle?.name,
        selectedEmploymentType: selectedEmploymentType?.name,
      };

      const result = await dispatch(generateContractWithAI(aiData));

      if (result.type === 'contracts/generateContractWithAI/fulfilled') {
        const response = result.payload as AIGenerateContractResponse;
        if (response.success && response.contractContent) {
          onSuccess(response.contractContent);
          setAiPrompt('');
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error generating contract:', error);
    }
  };

  const handleClose = () => {
    if (!isGeneratingAI) {
      setAiPrompt('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Contract Generation
          </DialogTitle>
          <DialogDescription>
            Provide additional details about the contract requirements, and we will generate a
            customized template based on your selected fields.
          </DialogDescription>
        </DialogHeader>

        {isGeneratingAI ? (
          <div className="py-8">
            <AIGenerationLoader {...AILoaderPresets.contractGeneration} size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Fields Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Selected Fields:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Title:</strong> {title || 'Not specified'}
                </div>
                <div>
                  <strong>Company:</strong> {companyDetails?.name || 'Not specified'}
                </div>
                <div>
                  <strong>Job Title:</strong> {selectedJobTitle?.name || 'Not selected'}
                </div>
                <div>
                  <strong>Employment Type:</strong> {selectedEmploymentType?.name || 'Not selected'}
                </div>
                <div className="col-span-2">
                  <strong>Duration:</strong> {contractDuration || 'Not specified'}
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
                disabled={isGeneratingAI}
              />
              <p className="text-xs text-muted-foreground">
                Example: &quot;Include health insurance benefits, flexible working hours, probation
                period of 3 months, and confidentiality clause for tech company.&quot;
              </p>
            </div>

            {/* Validation Message */}
            {(!jobTitleId || !employmentTypeId || !aiPrompt.trim()) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  Required for AI Generation:
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {!jobTitleId && <li>• Job Title must be selected</li>}
                  {!employmentTypeId && <li>• Employment Type must be selected</li>}
                  {!aiPrompt.trim() && <li>• Additional requirements must be provided</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isGeneratingAI}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGeneratingAI || !aiPrompt.trim() || !jobTitleId || !employmentTypeId}
          >
            {isGeneratingAI ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
