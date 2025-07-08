import { JobQuestion } from '@/types/interview';
import Button from '../ui/Button';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { updateJobQuestion } from '@/store/jobs/jobsThunks';
import { apiError, apiSuccess } from '@/lib/notification';
import { useAppDispatch } from '@/store';

interface EditQuestionProps {
  question: JobQuestion;
  onCancel: () => void;
}

const questionTypes = [
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'experience', label: 'Experience' },
];

const categories = [
  'Introduction',
  'Skills Assessment',
  'Behavioral Assessment',
  'Experience Assessment',
  'Technical Assessment',
  'Closing',
  'Custom',
];

export const EditQuestion = ({ question, onCancel }: EditQuestionProps) => {
  const [formData, setFormData] = useState({
    questionText: question.questionText,
    questionType: question.questionType,
    category: question.category || 'Custom',
    expectedDuration: question.expectedDuration,
    isRequired: question.isRequired,
  });
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useAppDispatch();

  const handleSaveUpdate = async () => {
    try {
      if (!formData.questionText.trim()) {
        apiError('Question text cannot be empty');
        return;
      }
      setIsSaving(true);
      await dispatch(
        updateJobQuestion({
          questionId: question.id,
          ...formData,
        }),
      ).unwrap();
      apiSuccess('Question updated successfully');
      onCancel();
    } catch {
      apiError('Failed to update question. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveUpdate();
        }}
      >
        {/* Question Text */}
        <textarea
          value={formData.questionText}
          onChange={(e) => setFormData((prev) => ({ ...prev, questionText: e.target.value }))}
          className="w-full p-3 border border-gray-light rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={3}
          autoFocus
          disabled={isSaving}
        />
        {/* Question Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.questionType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                questionType: e.target.value as typeof prev.questionType,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        {/* Expected Duration */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Expected Duration (seconds)
          </label>
          <input
            type="number"
            value={formData.expectedDuration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                expectedDuration: parseInt(e.target.value) || 120,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            min="30"
            max="600"
            step="30"
          />
        </div>
        {/* Required */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRequired"
            checked={formData.isRequired}
            onChange={(e) => setFormData((prev) => ({ ...prev, isRequired: e.target.checked }))}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="isRequired" className="ml-2 block text-xs text-gray-700">
            Required question
          </label>
        </div>
        <div className="flex gap-2">
          <Button isLoading={isSaving} size="sm" type="submit" disabled={isSaving}>
            <CheckIcon className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel} type="button">
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
