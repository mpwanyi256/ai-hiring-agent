import { EyeIcon, SparklesIcon, PlusIcon } from "@heroicons/react/24/outline";
import Button from "../ui/Button";
import { useAppSelector } from "@/store";
import { selectCurrentJob, selectJobQuestions } from "@/store/jobs/jobsSelectors";
import { useState } from "react";
import { QuestionStats } from "./QuestionStats";
import { generateJobQuestions } from "@/store/jobs/jobsThunks";
import { useAppDispatch } from "@/store";
import { apiError, apiSuccess } from "@/lib/notification";
import AddQuestionModal from "./AddQuestionModal";

export const QuestionsHeader = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const job = useAppSelector(selectCurrentJob);
    const questions = useAppSelector(selectJobQuestions);
    const dispatch = useAppDispatch();

    const handleGenerateQuestions = async() => {
      try {
        if (!job) return;
        setIsGenerating(true);
        await dispatch(generateJobQuestions({
          jobId: job.id,
          questionCount: 5,
          includeCustom: true,
          replaceExisting: true
        })).unwrap()
      } catch (error) {
        apiError('Failed to generate questions. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }

    const isJobInDraft = job?.status === 'draft';

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
            {!isJobInDraft && (
              <p className="text-amber-600 text-sm mt-1">
                ⚠️ Questions can only be modified when the job is in draft state
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            {isJobInDraft && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                variant="outline"
                className="flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            )}
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
        
        <AddQuestionModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
    </div>
  );
};