'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { addManualQuestion } from '@/store/jobs/jobsThunks';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import { apiError, apiSuccess } from '@/lib/notification';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function AddQuestionModal({ isOpen, onClose }: AddQuestionModalProps) {
  const dispatch = useAppDispatch();
  const job = useAppSelector(selectCurrentJob);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'general' as 'general' | 'technical' | 'behavioral' | 'experience',
    category: 'Custom',
    expectedDuration: 120,
    isRequired: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!job || !formData.questionText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        addManualQuestion({
          jobId: job.id,
          questionData: formData,
        }),
      ).unwrap();

      apiSuccess('Question added successfully');
      handleClose();
    } catch (error) {
      apiError(error instanceof Error ? error.message : 'Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      questionText: '',
      questionType: 'general',
      category: 'Custom',
      expectedDuration: 120,
      isRequired: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-primary/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Manual Question</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Question Text */}
          <div>
            <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => setFormData((prev) => ({ ...prev, questionText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Enter your question here..."
              required
            />
          </div>

          {/* Question Type */}
          <div>
            <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-2">
              Question Type *
            </label>
            <select
              id="questionType"
              value={formData.questionType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  questionType: e.target.value as
                    | 'general'
                    | 'technical'
                    | 'behavioral'
                    | 'experience',
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
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
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
            <label
              htmlFor="expectedDuration"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Expected Duration (seconds)
            </label>
            <input
              type="number"
              id="expectedDuration"
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
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-700">
              Required question
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.questionText.trim()}
              isLoading={isSubmitting}
            >
              Add Question
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
