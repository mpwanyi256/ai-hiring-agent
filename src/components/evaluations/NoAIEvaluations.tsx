import { ClockIcon, SparklesIcon } from "lucide-react"
import Button from '@/components/ui/Button';
import { triggerAIEvaluation } from "@/store/candidates/candidatesThunks";
import { useAppDispatch } from "@/store";
import { apiError, apiSuccess } from "@/lib/notification";

type NoAIEvaluationsProps = {
    className?: string;
    candidateId: string;
}

export const NoAIEvaluations = ({ className, candidateId }: NoAIEvaluationsProps) => {
    const dispatch = useAppDispatch()

    const handleTriggerAIEvaluation = async() => {
        try {
            await dispatch(triggerAIEvaluation({ candidateId, force: false })).unwrap()
            apiSuccess('AI evaluation started in background')
        } catch (error) {
            apiError('Failed to start AI evaluation. Please try again later.')
        }
    };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Evaluation Yet</h3>
          <p className="text-gray-600 mb-6">
            Generate an AI evaluation to see comprehensive candidate insights and scoring.
          </p>
          <Button 
            onClick={handleTriggerAIEvaluation}
            className="px-6 py-2"
            disabled={false}
          >
            {false ? (
              <>
                <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate AI Evaluation
              </>
            )}
          </Button>
        </div>
      </div>
  )
}