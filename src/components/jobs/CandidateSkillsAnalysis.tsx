'use client';

import { useAppSelector } from '@/store';
import { selectSelectedCandidate } from '@/store/selectedCandidate/selectedCandidateSelectors';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { AssesmentCard } from './AssesmentCard';

export const CandidateSkillsAnalysis = () => {
  const { skillsAssessment, traitsAssessment } =
    useAppSelector(selectSelectedCandidate)?.evaluation || {};

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
      <div className="flex items-center space-x-3">
        <DocumentTextIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-gray-900 text-base">Resume Analysis</h3>
        <div className="ml-auto">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-green-600">✓</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 mb-6">
        {skillsAssessment &&
          Object.keys(skillsAssessment).map((skill) => (
            <AssesmentCard
              key={skill}
              title={skill}
              score={skillsAssessment[skill].score}
              explanation={skillsAssessment[skill].explanation}
              strengths={skillsAssessment[skill].strengths}
            />
          ))}

        {traitsAssessment &&
          Object.keys(traitsAssessment).map((trait) => (
            <AssesmentCard
              key={trait}
              title={trait}
              score={traitsAssessment[trait as keyof typeof traitsAssessment]}
            />
          ))}
      </div>
    </div>
  );
};
