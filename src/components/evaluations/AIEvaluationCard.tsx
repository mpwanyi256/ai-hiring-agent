import React from 'react';
import { TrophyIcon, ExclamationTriangleIcon, StarIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { selectSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSelectors';

interface AIEvaluationCardProps {
  className?: string;
}

const getRecommendationColor = (recommendation: string) => {
  switch (recommendation) {
    case 'strong_yes':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'yes':
      return 'bg-green-50 text-green-600 border-green-200';
    case 'maybe':
      return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    case 'no':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'strong_no':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getRecommendationLabel = (recommendation: string) => {
  switch (recommendation) {
    case 'strong_yes':
      return 'Strong Yes';
    case 'yes':
      return 'Yes';
    case 'maybe':
      return 'Maybe';
    case 'no':
      return 'No';
    case 'strong_no':
      return 'Strong No';
    default:
      return 'Pending';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreIcon = (score: number) => {
  if (score >= 80) return <TrophyIcon className="w-4 h-4 text-green-600 mr-2" />;
  if (score >= 60) return <StarIcon className="w-4 h-4 text-yellow-600 mr-2" />;
  return <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2" />;
};

export const AIEvaluationCard: React.FC<AIEvaluationCardProps> = ({ className = '' }) => {
  const selectedCandidate = useSelector(selectSelectedCandidate);

  if (!selectedCandidate) return null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mt-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`flex text-sm font-semibold text-gray-900 flex items-center ${getScoreColor(selectedCandidate.evaluation.score)}`}
          >
            {getScoreIcon(selectedCandidate.evaluation.score)}
            Interview summary {selectedCandidate.evaluation.score}%
          </span>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(selectedCandidate.evaluation.recommendation)}`}
        >
          AI Recommendation: {getRecommendationLabel(selectedCandidate.evaluation.recommendation)}
        </div>
      </div>
      {selectedCandidate.evaluation.summary && (
        <p className="text-sm text-gray-700 mb-2">{selectedCandidate.evaluation.summary}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedCandidate.evaluation.strengths.length > 0 && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-green-700 mb-1">Strengths:</span>
            <div className="flex flex-col gap-1">
              {selectedCandidate.evaluation.strengths.slice(0, 4).map((s, i) => (
                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {selectedCandidate.evaluation.redFlags.length > 0 && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-yellow-700 mb-1">
              Areas for Improvement:
            </span>
            <div className="flex flex-col gap-1">
              {selectedCandidate.evaluation.redFlags.slice(0, 3).map((a, i) => (
                <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
        {selectedCandidate.evaluation.redFlags.length > 0 && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-red-700 mb-1">Red Flags:</span>
            <div className="flex flex-col gap-1">
              {selectedCandidate.evaluation.redFlags.slice(0, 3).map((r, i) => (
                <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {selectedCandidate.evaluation.createdAt && (
        <div className="text-xs text-gray-400 mt-2">
          Evaluated on {new Date(selectedCandidate.evaluation.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default AIEvaluationCard;
