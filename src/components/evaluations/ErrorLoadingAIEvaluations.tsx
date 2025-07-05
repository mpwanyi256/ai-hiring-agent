import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import Button from "../ui/Button"
import { useAppDispatch } from "@/store"
import { fetchAIEvaluation } from "@/store/candidates/candidatesThunks"

type ErrorLoadingAIEvaluationsProps = {
  className?: string;
  error: string;
  candidateId: string;
}

export const ErrorLoadingAIEvaluations = ({ className, error, candidateId }: ErrorLoadingAIEvaluationsProps) => {
  const dispatch = useAppDispatch()

  return (
    <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Error Loading Evaluation</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => dispatch(fetchAIEvaluation(candidateId))} variant="outline">
          Retry
        </Button>
      </div>
  )
}