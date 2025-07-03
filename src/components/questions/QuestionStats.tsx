import { useAppSelector } from "@/store";
import { selectJobQuestionStats } from "@/store/jobs/jobsSelectors";
import { formatDuration } from "@/lib/utils";

export const QuestionStats = () => {
    const stats = useAppSelector(selectJobQuestionStats);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-text">{stats.total}</div>
            <div className="text-xs text-muted-text">Total Questions</div>
        </div>
        <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">{stats.aiGenerated}</div>
            <div className="text-xs text-muted-text">AI Generated</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{stats.required}</div>
            <div className="text-xs text-muted-text">Required</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.optional}</div>
            <div className="text-xs text-muted-text">Optional</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.estimatedDuration)}</div>
            <div className="text-xs text-muted-text">Est. Duration</div>
        </div>
    </div>
  );
};