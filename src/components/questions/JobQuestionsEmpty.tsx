import { SparklesIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useState } from 'react';
import { generateJobQuestions } from '@/store/jobs/jobsThunks';
import { apiError } from '@/lib/notification';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectCurrentJob } from '@/store/jobs/jobsSelectors';
import Image from 'next/image';

export const JobQuestionsEmpty = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const job = useAppSelector(selectCurrentJob);
  const dispatch = useAppDispatch();

  const handleGenerateQuestions = async () => {
    try {
      if (!job) return;
      setIsGenerating(true);
      await dispatch(
        generateJobQuestions({
          jobId: job.id,
          questionCount: 5,
          includeCustom: true,
          replaceExisting: true,
        }),
      ).unwrap();
    } catch {
      apiError('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-light h-[300px] flex items-center justify-center">
      <div className="p-4 flex flex-col gap-2 items-center justify-center">
        <Image
          src="/illustrations/empty_list.svg"
          alt="No questions yet"
          width={200}
          height={200}
          objectFit="contain"
        />
        <span className="text-muted-text">No questions yet</span>
        <Button
          onClick={handleGenerateQuestions}
          disabled={isGenerating}
          className="flex items-center"
        >
          <SparklesIcon className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Questions'}
        </Button>
      </div>
    </div>
  );
};
