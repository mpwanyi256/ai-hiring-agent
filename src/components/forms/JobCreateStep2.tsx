import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import Button from '@/components/ui/Button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { defaultJobDescriptionMarkdown } from '@/lib/constants';
import { marked } from 'marked';
import { JobFormData } from '@/types/jobs';

interface JobCreateStep2Props {
  form: UseFormReturn<JobFormData>;
  customFields: any;
  appendCustomField: any;
  removeCustomField: any;
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

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6 text-[15px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-text">Description & Requirements</h2>
        <Button type="button" variant="secondary" className="!py-1 !px-3 !text-xs !font-normal">
          + Write new with AI
        </Button>
      </div>
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
          className="min-h-[500px]"
          content={form.watch('jobDescription')}
          onChange={(val) => form.setValue('jobDescription', val)}
        />
        <div className="text-right text-xs text-muted-text mt-1">
          {form.watch('jobDescription')?.length || 0}/10,000
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <Button type="button" onClick={onPrev} className="min-w-[120px]">
          Back
        </Button>
        <Button type="button" onClick={onNext} className="min-w-[120px]" disabled={isSubmitting}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default JobCreateStep2;
