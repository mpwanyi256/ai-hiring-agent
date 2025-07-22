import React, { useEffect } from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAIEvaluation } from '@/store/candidates/candidatesThunks';
import { StarIcon, UserIcon } from '@heroicons/react/24/outline';

const EvaluationsTab: React.FC<{ candidate: CandidateWithEvaluation }> = ({ candidate }) => {
  const dispatch = useAppDispatch();
  const aiEvalState = useAppSelector((state) => state.candidates.aiEvaluation);
  const response = aiEvalState.currentEvaluation as any;
  const teamAssessments = response?.teamAssessments || [];
  const isLoading = aiEvalState.isLoadingEvaluation;
  const error = useAppSelector((state) => state.candidates.error);

  useEffect(() => {
    if (candidate.id) {
      dispatch(fetchAIEvaluation(candidate.id));
    }
  }, [candidate.id, dispatch]);

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading evaluations...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }
  if (!teamAssessments.length) {
    return <div className="text-gray-400 text-sm">No team evaluations yet.</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-2 text-primary-700">Team Evaluations</h4>
      <ul className="space-y-3">
        {teamAssessments.map((assessment: any) => (
          <li
            key={assessment.id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{assessment.assessorName}</div>
                <div className="text-xs text-gray-500">{assessment.assessorRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <span className="font-medium text-gray-800">{assessment.overallRating}/5</span>
            </div>
            {assessment.assessmentComments && (
              <div className="text-sm text-gray-700 mt-2 md:mt-0 md:max-w-md">
                {assessment.assessmentComments}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EvaluationsTab;
