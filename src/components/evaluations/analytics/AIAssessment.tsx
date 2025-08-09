import React from 'react';

interface AIAssessmentProps {
  ai?: {
    overall_score: number;
    overall_status: string;
    recommendation: string;
    evaluation_summary: string;
    key_strengths?: string[];
    areas_for_improvement?: string[];
    red_flags?: string[];
  } | null;
}

export function AIAssessment({ ai }: AIAssessmentProps) {
  if (!ai) return null;
  const {
    overall_score,
    overall_status,
    recommendation,
    evaluation_summary,
    key_strengths,
    areas_for_improvement,
    red_flags,
  } = ai;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">AI Assessment</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
          {overall_status}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{evaluation_summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Recommendation</div>
          <div className="text-sm font-medium capitalize">{recommendation.replace('_', ' ')}</div>
          <div className="text-xs text-gray-500 mt-1">Overall score: {overall_score}%</div>
        </div>
        {key_strengths && key_strengths.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Key Strengths</div>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {key_strengths.slice(0, 5).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {(red_flags && red_flags.length > 0) ||
        (areas_for_improvement && areas_for_improvement.length > 0) ? (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Risks / Improvements</div>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {red_flags?.slice(0, 3).map((r, i) => (
                <li key={`rf-${i}`} className="text-red-700">
                  {r}
                </li>
              ))}
              {areas_for_improvement?.slice(0, 3).map((a, i) => (
                <li key={`ai-${i}`}>{a}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
