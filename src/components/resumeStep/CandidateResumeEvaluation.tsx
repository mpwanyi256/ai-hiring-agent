import { SparklesIcon } from '@heroicons/react/24/outline';
import { JobData } from '@/lib/services/jobsService';
import { ResumeEvaluation } from '@/types/interview';
import { getScoreColor } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { apiSuccess } from '@/lib/notification';

interface CandidateResumeEvaluationProps {
  evaluation: ResumeEvaluation;
  job: JobData;
}

export const CandidateResumeEvaluation = ({ evaluation, job }: CandidateResumeEvaluationProps) => {
  const proceedToInterview = () => {
    apiSuccess('You are now ready to proceed to the interview questions.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center p-8 mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-accent shadow-lg">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-3">Resume Analysis Complete</h1>
          <p className="text-lg text-muted-text mx-auto">
            We have analyzed your resume against the requirements for the{' '}
            <span className="font-semibold text-primary">{job.title}</span> position
          </p>
        </div>

        {/* Analysis Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Skills Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-lg">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-text">Skills Assessment</h3>
            </div>

            {evaluation.matchingSkills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-green-700 mb-2">✅ Matching Skills</p>
                <div className="flex flex-wrap gap-2">
                  {evaluation.matchingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {evaluation.missingSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">📚 Development Areas</p>
                <div className="flex flex-wrap gap-2">
                  {evaluation.missingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Experience Assessment */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold text-lg">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-text">Experience Level</h3>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  evaluation.experienceMatch === 'match'
                    ? 'bg-green-100 text-green-800'
                    : evaluation.experienceMatch === 'over'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {evaluation.experienceMatch === 'match'
                  ? '✅ Perfect Match'
                  : evaluation.experienceMatch === 'over'
                    ? '🚀 Overqualified'
                    : '📈 Developing'}
              </span>
            </div>
            <p className="text-sm text-muted-text mt-3">
              {evaluation.experienceMatch === 'match'
                ? 'Your experience level aligns well with our requirements.'
                : evaluation.experienceMatch === 'over'
                  ? 'You have more experience than required for this role.'
                  : 'With some growth, you could be a great fit for this position.'}
            </p>
          </div>

          {/* AI Recommendation */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                <span className="text-indigo-600 font-bold text-lg">💼</span>
              </div>
              <h3 className="text-lg font-semibold text-text">Recommendation</h3>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  evaluation.recommendation === 'proceed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {evaluation.recommendation === 'proceed'
                  ? '✅ Proceed to Interview'
                  : '❌ Not Recommended'}
              </span>
            </div>
            <p className="text-sm text-muted-text mt-3">
              {evaluation.recommendation === 'proceed'
                ? 'Based on your qualifications, you have strong potential for this role.'
                : 'Consider strengthening your profile before applying.'}
            </p>
          </div>

          {/* Overall Assessment */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold text-lg">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-text">Match Summary</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-text">Skills Match</span>
                <span className="text-sm font-medium">
                  {evaluation.matchingSkills.length}/
                  {evaluation.matchingSkills.length + evaluation.missingSkills.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-text">Overall Score</span>
                <span className={`text-sm font-medium ${getScoreColor(evaluation.score)}`}>
                  {evaluation.score}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-text">Status</span>
                <span
                  className={`text-sm font-medium ${
                    evaluation.passesThreshold ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {evaluation.passesThreshold ? 'Qualified' : 'Not Qualified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
          {evaluation.passesThreshold ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-text mb-2">Ready for the Next Step!</h3>
                <p className="text-muted-text mb-6">
                  You&apos;ve passed our initial screening. Let&apos;s continue with the interview
                  questions to learn more about your experience and fit for this role.
                </p>
              </div>
              <Button
                onClick={proceedToInterview}
                className="w-full sm:w-auto px-8 py-3 text-lg bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-300"
              >
                Continue to Interview Questions
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-muted-text">
                The interview will take approximately 10-15 minutes to complete.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-text mb-2">Keep Improving!</h3>
                <p className="text-muted-text mb-6">
                  While your resume doesn&apos;t meet our current minimum requirements, we encourage
                  you to continue developing your skills and experience.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="px-6 py-2"
                >
                  Try Different Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/jobs', '_blank')}
                  className="px-6 py-2"
                >
                  Browse Other Positions
                </Button>
              </div>
              <p className="text-sm text-muted-text">
                Consider strengthening the highlighted skill areas and gaining more relevant
                experience.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
