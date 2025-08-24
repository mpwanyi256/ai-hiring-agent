import React, { useEffect, useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { JobFormData } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import RichTextEditor, { RichTextEditorRef } from '@/components/ui/RichTextEditor';
import { defaultJobDescriptionMarkdown } from '@/lib/constants';
import { marked } from 'marked';
import Modal from '@/components/ui/Modal';
import { useAppDispatch } from '@/store';
import { generateJobDescriptionWithAI } from '@/store/jobs/jobsThunks';
import { useToast } from '@/components/providers/ToastProvider';
import { apiError } from '@/lib/notification';
import { useAutoScroll } from '@/hooks/useAutoScroll';

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

    // Trigger initial scroll when streaming starts
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.scrollToBottom();
      }
    }, 50);

    try {
      const values = form.getValues();
      // reset the job description
      form.setValue('jobDescription', '');
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

            // Trigger scroll on each progress update
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.scrollToBottom();
              }
            }, 25);
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

  // RichTextEditor ref for auto-scrolling
  const editorRef = useRef<RichTextEditorRef>(null);

  // Enhanced auto-scroll effect for streaming content
  useEffect(() => {
    if (isStreaming && editorRef.current) {
      // Auto-scroll to bottom to show new content with proper timing
      const scrollToBottom = () => {
        if (editorRef.current) {
          editorRef.current.scrollToBottom();
        }
      };

      // Scroll immediately and then with a small delay to catch any DOM updates
      scrollToBottom();
      const timeoutId = setTimeout(scrollToBottom, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [form.watch('jobDescription'), isStreaming]);

  // Additional aggressive auto-scroll for better UX during streaming
  useEffect(() => {
    if (isStreaming && editorRef.current) {
      // More aggressive scrolling with multiple timeouts for better responsiveness
      const scrollToBottom = () => {
        if (editorRef.current) {
          editorRef.current.scrollToBottom();
        }
      };

      // Scroll multiple times to ensure content is visible
      scrollToBottom();
      const timeout1 = setTimeout(scrollToBottom, 25);
      const timeout2 = setTimeout(scrollToBottom, 75);
      const timeout3 = setTimeout(scrollToBottom, 150);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [form.watch('jobDescription'), isStreaming]);

  // Additional auto-scroll effect that triggers on every content change during streaming
  useEffect(() => {
    if (isStreaming && editorRef.current) {
      // Scroll to bottom whenever streaming content updates
      const timer = setTimeout(() => {
        editorRef.current?.scrollToBottom();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [form.watch('jobDescription'), isStreaming]);

  // Most aggressive scroll trigger - fires on every character change during streaming
  useEffect(() => {
    if (isStreaming && editorRef.current) {
      // Immediate scroll with minimal delay for maximum responsiveness
      const immediateScroll = () => {
        editorRef.current?.scrollToBottom();
      };

      // Multiple scroll attempts with different timing for reliability
      immediateScroll();
      const timeout1 = setTimeout(immediateScroll, 10);
      const timeout2 = setTimeout(immediateScroll, 50);
      const timeout3 = setTimeout(immediateScroll, 100);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
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
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
            <span className="text-sm font-medium">
              AI is generating your job description in real-time...
            </span>
            <span className="text-xs text-green-600">
              ({form.watch('jobDescription')?.length.toLocaleString() || 0} characters generated)
            </span>
          </div>
          <div className="mt-2 w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(((form.watch('jobDescription')?.length || 0) / 1000) * 100, 100)}%`,
              }}
            />
          </div>
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
        <RichTextEditor
          ref={editorRef}
          content={form.watch('jobDescription')}
          onChange={(val) => form.setValue('jobDescription', val)}
          className="h-[400px] overflow-y-auto"
          disabled={isStreaming}
        />
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
