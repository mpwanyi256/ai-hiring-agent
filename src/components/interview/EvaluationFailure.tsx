import { ResumeEvaluation, InterviewEvaluation } from '@/types/interview';
import { DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { domainEmails } from '@/lib/constants';
import Image from 'next/image';

interface EvaluationFailureProps {
  evaluation?: ResumeEvaluation | InterviewEvaluation | null;
}

export const EvaluationFailure = ({ evaluation }: EvaluationFailureProps) => {
  // Extract resume evaluation data
  const resumeScore = evaluation?.score || (evaluation as InterviewEvaluation)?.resumeScore;
  const resumeSummary = evaluation?.summary || (evaluation as InterviewEvaluation)?.resumeSummary;
  const feedback = evaluation?.feedback || '';
  const strengths = (evaluation as InterviewEvaluation)?.strengths || [];
  const redFlags = (evaluation as InterviewEvaluation)?.redFlags || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Failure Icon */}
        <div className="w-[200px] h-[200px] bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Image
            src="/illustrations/evaluation.svg"
            alt="Success"
            width={150}
            height={150}
            objectFit="contain"
          />
        </div>

        {/* Score Display */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{resumeScore || 0}</span>
            </div>
          </div>
          <p className="text-center text-red-700 font-semibold">
            Resume Match Score: {resumeScore || 0}%
          </p>
          <p className="text-center text-red-600 text-sm mt-2">Minimum required score: 50%</p>
        </div>

        {/* Evaluation Summary */}
        {resumeSummary && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <DocumentTextIcon className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Evaluation Summary</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{resumeSummary}</p>
          </div>
        )}

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">Key Strengths</h3>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-green-800">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {redFlags && redFlags.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-semibold text-yellow-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {redFlags.map((flag, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span className="text-yellow-800">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Detailed Feedback</h3>
            <p className="text-blue-800 leading-relaxed">{feedback.replace('AI Analysis:', '')}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => window.close()} className="sm:w-auto w-full">
            Close Window
          </Button>
          <Button onClick={() => (window.location.href = '/')} className="sm:w-auto w-full">
            Visit Our Website
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            We encourage you to update your resume and apply again in the future. For questions
            about this evaluation, please contact our support team at{' '}
            <a
              href={`mailto:${domainEmails.support}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {domainEmails.support}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
