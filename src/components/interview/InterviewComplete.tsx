'use client';

import { useEffect } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '@/store';
import { loadedInterview, selectCandidate } from '@/store/interview/interviewSelectors';
import Image from 'next/image';
import { domainEmails } from '@/lib/constants';
import {
  selectCurrentInterviewEvaluation,
  selectCurrentResumeEvaluation,
} from '@/store/evaluation/evaluationSelectors';
import { EvaluationFailure } from './EvaluationFailure';

export default function InterviewComplete() {
  const job = useAppSelector(loadedInterview);
  const candidate = useAppSelector(selectCandidate);
  const interviewEvaluation = useAppSelector(selectCurrentInterviewEvaluation);
  const resumeEvaluation = useAppSelector(selectCurrentResumeEvaluation);

  // Update candidate progress to completed
  useEffect(() => {
    if (candidate?.id) {
      const updateCandidateProgress = async () => {
        try {
          await fetch(`/api/candidates/${candidate.id}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isCompleted: true,
              currentStep: 5,
              totalSteps: 5,
              candidateInfo: {
                id: candidate.candidateInfoId,
                jobId: candidate.jobId,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
              },
            }),
          });
        } catch {
          // Error updating candidate progress
        }
      };

      updateCandidateProgress();
    }
  }, [candidate?.id]);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-text mb-2">Interview Complete!</h1>
          <p className="text-muted-text text-lg">
            Thank you for taking the time to complete the interview for <strong>Job Title</strong>.
          </p>
          <p className="text-muted-text text-lg">
            We will review your interview and get back to you soon. Thank you for your patience.
          </p>
        </div>
      </div>
    );
  }

  // Check for resume evaluation failure - check both resume evaluation and interview evaluation resumeScore
  const resumeScore = resumeEvaluation?.score ?? interviewEvaluation?.resumeScore;
  if (resumeScore !== undefined && resumeScore < 50) {
    return <EvaluationFailure evaluation={resumeEvaluation || interviewEvaluation} />;
  }

  return (
    <div className="p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-[200px] h-[200px] bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image
              src="/illustrations/success.svg"
              alt="Success"
              width={150}
              height={150}
              objectFit="contain"
            />
          </div>
          <p className="text-muted-text text-lg">
            Thank you for taking the time to apply for the <strong>{job.title}</strong> position.
          </p>
        </div>

        {/* Interview Details */}
        {/* <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-light rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-semibold text-text">Position</h3>
            </div>
            <p className="text-muted-text">{job.title}</p>
          </div>

          <div className="bg-white border border-gray-light rounded-lg p-4">
            <div className="flex items-center mb-2">
              <BuildingOfficeIcon className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-semibold text-text">Interview Format</h3>
            </div>
            <p className="text-muted-text capitalize">
              {job.interviewFormat === 'text' ? 'Text-based' : 'Video'} Interview
            </p>
          </div>
        </div> */}

        {/* Additional Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <EnvelopeIcon className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Stay Connected</h3>
              <p className="text-green-700 text-sm">
                Make sure to check your email regularly for updates. If you provided an email
                address during the interview, we&apos;ll send you confirmation and any follow-up
                communications there.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => window.close()} className="sm:w-auto w-full">
            Close Window
          </Button>
          <Button onClick={() => (window.location.href = '/')} className="sm:w-auto w-full">
            Visit Our Website
          </Button>
        </div> */}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-light">
          <p className="text-sm text-muted-text">
            Questions about your interview? Feel free to reach out to our support team at{' '}
            <a
              href={`mailto:${domainEmails.support}`}
              className="text-primary hover:text-primary/80"
            >
              {domainEmails.support}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
