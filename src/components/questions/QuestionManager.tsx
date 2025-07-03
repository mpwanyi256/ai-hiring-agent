'use client';

import { useAppSelector } from '@/store';
import { selectJobsLoading } from '@/store/jobs/jobsSelectors';
import { QuestionsHeader } from './QuestionsHeader';
import { JobQuestions } from './JobQuestions';

export default function QuestionManager() {
  const isLoading = useAppSelector(selectJobsLoading);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">Loading questions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <QuestionsHeader />
      {/* Questions List */}
      <JobQuestions />
    </div>
  );
} 