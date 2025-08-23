import React, { useEffect, useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { JobFormData } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { defaultJobDescriptionMarkdown } from '@/lib/constants';
import { marked } from 'marked';
import Modal from '@/components/ui/Modal';
import { useAppDispatch } from '@/store';
import { generateJobDescriptionWithAI } from '@/store/jobs/jobsThunks';
import { useToast } from '@/components/providers/ToastProvider';
import { apiError } from '@/lib/notification';

interface JobCreateStep2Props {
  form: UseFormReturn<JobFormData>;
  customFields: Array<{
    key: string;
    value: string;
    inputType: 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email';
  }>;
  appendCustomField: (field: {
    key: string;
    value: string;
    inputType: 'text' | 'textarea' | 'number' | 'file' | 'url' | 'email';
  }) => void;
  removeCustomField: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isSubmitting: boolean;
}

const JobCreateStep2: React.FC<JobCreateStep2Props> = ({ form, onPrev, onNext, isSubmitting }) => {
  // Pre-populate with default HTML if empty
  useEffect(() => {
    if (!form.getValues('jobDescription')) {
      const html = marked.parse(defaultJobDescriptionMarkdown) as string;
      form.setValue('jobDescription', html);
    }
  }, [form]);

  // Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const dispatch = useAppDispatch();
  const { error: showError } = useToast();

  // AI generation logic with streaming support
  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setIsStreaming(true);
    setAiModalOpen(false); // Hide modal when streaming starts

    try {
      const values = form.getValues();
      const resultAction = await dispatch(
        generateJobDescriptionWithAI({
          title: values.title,
          departmentId: values.departmentId,
          employmentTypeId: values.employmentTypeId,
          workplaceType: values.workplaceType,
          jobType: values.jobType,
          experienceLevel: values.experienceLevel,
          skills: values.skills,
          traits: values.traits,
          onProgress: (content: string) => {
            // Update the form with streaming content
            form.setValue('jobDescription', content);
          },
        }),
      );

      if (generateJobDescriptionWithAI.fulfilled.match(resultAction)) {
        form.setValue('jobDescription', resultAction.payload);
      } else {
        showError('Failed to generate job description.');
      }
    } catch (e) {
      apiError(e instanceof Error ? e.message : 'Failed to generate job description.');
      showError('Failed to generate job description.');
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  // Auto-scroll effect for streaming content
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && editorRef.current) {
      // Auto-scroll to bottom to show new content
      const scrollToBottom = () => {
        if (editorRef.current) {
          editorRef.current.scrollTop = editorRef.current.scrollHeight;
        }
      };

      // Scroll immediately and then with a small delay to catch any DOM updates
      scrollToBottom();
      const timeoutId = setTimeout(scrollToBottom, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [form.watch('jobDescription'), isStreaming]);

  // Disable all interactive elements during streaming
  const isDisabled = isStreaming || isSubmitting;

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6 text-[15px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-text">Description & Requirements</h2>
        <Button
          type="button"
          variant="secondary"
          className="py-1 px-3 text-xs font-normal"
          onClick={() => setAiModalOpen(true)}
          disabled={isDisabled}
        >
          + Write new with AI
        </Button>
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="bg-green-50 border border-green-200 rounded px-3 py-2 mb-4 text-sm text-green-900 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2" />
          <span>AI is generating your job description in real-time...</span>
        </div>
      )}

      {/* One-line hint */}
      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-4 text-xs text-blue-900 flex items-center">
        <span className="mr-2">💡</span>
        <span>
          Create a high quality job post using our suggested guide below.{' '}
          <a href="#" className="underline font-medium">
            Learn more
          </a>
        </span>
      </div>

      {/* Job Description */}
      <div className="mb-4">
        <label htmlFor="jobDescription" className="block text-sm font-medium text-text mb-2">
          Description*
        </label>
        <div ref={editorRef} className="max-h-[400px] overflow-y-auto">
          <RichTextEditor
            content={form.watch('jobDescription')}
            onChange={(val) => form.setValue('jobDescription', val)}
            className="min-h-[250px]"
            disabled={isStreaming}
          />
        </div>
        <div className="text-right text-xs text-muted-text mt-1">
          {form.watch('jobDescription')?.length || 0}/10,000
        </div>
      </div>

      {/* Save as Template Option */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="saveAsTemplate"
          {...form.register('saveAsTemplate')}
          className="mr-2"
          disabled={isDisabled}
        />
        <label htmlFor="saveAsTemplate" className="text-sm">
          Save as template
        </label>
        {form.watch('saveAsTemplate') && (
          <input
            type="text"
            placeholder="Template name"
            {...form.register('templateName')}
            className="ml-2 px-2 py-1 border rounded text-sm"
            disabled={isDisabled}
          />
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button type="button" onClick={onPrev} className="min-w-[120px]" disabled={isDisabled}>
          Back
        </Button>
        <Button type="button" onClick={onNext} className="min-w-[120px]" disabled={isDisabled}>
          Create job
        </Button>
      </div>

      {/* Write with AI Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Write new job description with AI"
      >
        <div className="mb-4 text-sm text-text">
          <p>
            We&apos;ll use the information provided and AI to create a suggested job description.
            <br />
            Writing a new job description will replace any initial text or edits you&apos;ve made.
          </p>
          <a href="#" className="underline font-medium">
            Learn more
          </a>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAiModalOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerateWithAI} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              'Continue writing'
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default JobCreateStep2;
