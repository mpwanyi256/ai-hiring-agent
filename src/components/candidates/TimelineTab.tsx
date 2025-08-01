import React from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import CandidateTimeline from './CandidateTimeline';

interface TimelineTabProps {
  candidate: CandidateWithEvaluation;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ candidate }) => {
  return (
    <div className="h-full overflow-y-auto">
      <CandidateTimeline candidateId={candidate.id} />
    </div>
  );
};

export default TimelineTab;
