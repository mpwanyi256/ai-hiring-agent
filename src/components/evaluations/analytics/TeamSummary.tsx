import React from 'react';

interface TeamSummaryProps {
  teamSummary?: {
    total_responses: number;
    positive_votes: number;
    negative_votes: number;
    neutral_votes: number;
    avg_confidence: number | null;
    avg_technical_skills: number | null;
    avg_communication_skills: number | null;
    avg_cultural_fit: number | null;
  };
}

export function TeamSummary({ teamSummary }: TeamSummaryProps) {
  if (!teamSummary) return null;
  const {
    total_responses,
    positive_votes,
    negative_votes,
    neutral_votes,
    avg_confidence,
    avg_technical_skills,
    avg_communication_skills,
    avg_cultural_fit,
  } = teamSummary;
  if (total_responses === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{total_responses}</div>
          <div className="text-xs text-gray-500">Total Responses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{positive_votes}</div>
          <div className="text-xs text-gray-500">Positive</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{negative_votes}</div>
          <div className="text-xs text-gray-500">Negative</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-600">{neutral_votes}</div>
          <div className="text-xs text-gray-500">Neutral</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {avg_confidence ?? '-'}
            {avg_confidence != null ? '' : ''}
          </div>
          <div className="text-xs text-gray-500">Avg Confidence</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{avg_technical_skills ?? '-'}</div>
          <div className="text-xs text-gray-500">Avg Technical</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {avg_communication_skills ?? '-'}
          </div>
          <div className="text-xs text-gray-500">Avg Communication</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{avg_cultural_fit ?? '-'}</div>
          <div className="text-xs text-gray-500">Avg Culture Fit</div>
        </div>
      </div>
    </div>
  );
}
