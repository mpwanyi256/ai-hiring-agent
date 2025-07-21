import React from 'react';
import { CandidateWithEvaluation } from '@/types/candidates';
import InterviewCard from '../dashboard/InterviewCard';

const GeneralTab: React.FC<{ candidate: CandidateWithEvaluation }> = ({ candidate }) => (
  <div className="space-y-4">
    <div>
      <h4 className="font-medium mb-1 text-primary-700">Interview Details</h4>
      {candidate.interviewDetails ? (
        <InterviewCard
          interview={{
            interview_id: candidate.interviewDetails.id,
            candidate_id: candidate.id,
            interview_date: candidate.interviewDetails.date,
            interview_time: candidate.interviewDetails.time,
            interview_status: candidate.interviewDetails.status,
            candidate_first_name: candidate.firstName,
            candidate_last_name: candidate.lastName,
            candidate_email: candidate.email,
            job_title: candidate.jobTitle,
            meet_link: candidate.interviewDetails.meet_link || undefined,
            job_id: candidate.jobId,
          }}
        />
      ) : (
        <div className="text-gray-400 text-sm">No interview scheduled.</div>
      )}
    </div>
  </div>
);

export default GeneralTab;
