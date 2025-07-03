import { EyeIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Button from "../ui/Button";
import { useAppSelector } from "@/store";
import { selectCurrentJob, selectJobQuestions } from "@/store/jobs/jobsSelectors";
import { useState } from "react";
import { QuestionStats } from "./QuestionStats";
import { generateJobQuestions } from "@/store/jobs/jobsThunks";
import { useAppDispatch } from "@/store";
import { apiError, apiSuccess } from "@/lib/notification";

export const QuestionsHeader = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const job = useAppSelector(selectCurrentJob);
    const questions = useAppSelector(selectJobQuestions);
    const dispatch = useAppDispatch();

    const handleGenerateQuestions = async() => {
      try {
        if (!job) return;
        setIsGenerating(true);
        await dispatch(generateJobQuestions({
          jobId: job.id,
          questionCount: 8,
          includeCustom: true,
          replaceExisting: true
        })).unwrap()
        
        apiSuccess('Questions generated successfully');
      } catch (error) {
        console.error('Error generating questions:', error);
        apiError('Failed to generate questions. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text flex items-center">
              <SparklesIcon className="w-5 h-5 mr-1" color="black" />
              Interview Questions
            </h2>
            <p className="text-muted-text text-sm">
              AI-generated questions for <span className="font-medium">{job?.title}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
              className="flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : questions.length > 0 ? 'Regenerate' : 'Generate Questions'}
            </Button>
          </div>
        </div>
        <QuestionStats />
    </div>
  );
};