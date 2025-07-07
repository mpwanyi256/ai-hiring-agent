import { useAppDispatch, useAppSelector } from "@/store";
import { selectCurrentJob, selectJobQuestions } from "@/store/jobs/jobsSelectors";
import { JobQuestionWrapper } from "./JobQuestionWrapper";
import { reorderJobQuestions } from "@/store/jobs/jobsThunks";
import { apiSuccess } from "@/lib/notification";
import { JobQuestionsEmpty } from "./JobQuestionsEmpty";

export const JobQuestions = () => {
    const job = useAppSelector(selectCurrentJob);
    const questions = useAppSelector(selectJobQuestions);
    const dispatch = useAppDispatch();
    
    const isJobInDraft = job?.status === 'draft';
    
    const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
        if (!isJobInDraft) return;
        
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;
    
        const reorderedQuestions = [...questions];
        [reorderedQuestions[currentIndex], reorderedQuestions[newIndex]] = 
        [reorderedQuestions[newIndex], reorderedQuestions[currentIndex]];
    
        const newOrder = reorderedQuestions.map(q => q.id);
        
        try {
          await dispatch(reorderJobQuestions({ questionIdsOrder: newOrder })).unwrap();
          apiSuccess('Questions reordered successfully');
        } catch (error) {
          console.error('Error reordering questions:', error);
        }
      };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!isJobInDraft) return;
        
        if (!confirm('Are you sure you want to delete this question?')) return;
    
        try {
            // get Job Id from rootState
          const response = await fetch(`/api/jobs/${job?.id}/questions/${questionId}`, {
            method: 'DELETE'
          });
    
          if (response.ok) {
            // await refreshQuestions();
          }
        } catch (error) {
          console.error('Error deleting question:', error);
        }
      };

    if (!questions.length) {
        return <JobQuestionsEmpty />
    }

    return (
        <div className="flex-1 bg-white rounded-lg border border-gray-light">
            <div className="p-4 border-b border-gray-light">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-text">Questions ({questions.length})</h3>
                    {!isJobInDraft && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Read-only mode
                        </span>
                    )}
                </div>
            </div>

            <div className="divide-y divide-gray-light">
                {questions.map((question) => (
                    <JobQuestionWrapper
                        key={question.id}
                        question={question}
                        questionsCount={questions.length}
                        onMoveQuestion={handleMoveQuestion}
                        onDeleteQuestion={handleDeleteQuestion}
                        isEditingDisabled={!isJobInDraft}
                    />
                ))}
            </div>
        </div>
    )
}
