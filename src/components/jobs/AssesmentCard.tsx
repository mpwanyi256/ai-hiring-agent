interface AssesmentCardProps {
  title: string;
  score: number;
  explanation?: string;
  strengths?: string[];
}

export const AssesmentCard = ({ title, score, explanation, strengths }: AssesmentCardProps) => {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {title.replace(/_/g, ' ')}
        </span>
        <span className="text-sm font-bold text-primary">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${score}%` }}></div>
      </div>
      {explanation && <div className="text-xs text-gray-600 mt-2">{explanation}</div>}
      {strengths && (
        <div className="text-xs text-gray-600 mt-2">
          <span className="font-bold">Strengths:</span> {strengths.join(', ')}
        </div>
      )}
    </div>
  );
};
