import { useAppSelector } from '@/store';
import { loadedInterview } from '@/store/interview/interviewSelectors';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function JobOverviewTab() {
  const job = useAppSelector(loadedInterview);
  if (!job) return null;

  return (
    <div className="space-y-8">
      {/* Job Description */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {job.fields?.jobDescription && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About this role</h3>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: job.fields.jobDescription }}
            />
          </div>
        )}
      </div>
      {/* Application Process */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-blue-600" />
          Application Process
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Resume Evaluation</h4>
              <p className="text-gray-600 text-sm">
                Upload your resume for analysis against job requirements (60% minimum score
                required).
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Application Questions</h4>
              <p className="text-gray-600 text-sm">
                Answer personalized questions based on the job requirements and your background.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Evaluation & Review</h4>
              <p className="text-gray-600 text-sm">
                Your responses are evaluated and insights are provided to the hiring team.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Application Guidelines */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Guidelines</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Be Authentic</p>
                <p>Answer honestly and let your personality shine through your responses.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Take Your Time</p>
                <p>There&apos;s no time pressure. Think through your answers carefully.</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Use Examples</p>
                <p>Support your answers with specific examples from your experience.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-gray-900">Stay Professional</p>
                <p>Maintain a professional tone while being conversational.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
