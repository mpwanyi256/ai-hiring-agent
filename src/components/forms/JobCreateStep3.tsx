import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import QuestionManager from '@/components/questions/QuestionManager';

interface JobCreateStep3Props {
  onPrev: () => void;
  onFinish: () => void;
  jobId?: string;
}

const JobCreateStep3: React.FC<JobCreateStep3Props> = ({ onPrev, onFinish, jobId }) => {
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualQuestions, setManualQuestions] = useState<string[]>([]);

  const handleAddManualQuestion = () => {
    if (manualQuestion.trim()) {
      setManualQuestions([...manualQuestions, manualQuestion.trim()]);
      setManualQuestion('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6 text-[15px]">
      <h2 className="text-lg font-semibold text-text mb-6">Screening Questions</h2>
      {/* Info Box */}
      <div className="flex items-center bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm text-blue-900">
        <span className="mr-2">💡</span>
        <span>
          Add screening questions to help you filter candidates before interviews. You can generate
          questions with AI, add them manually, or skip this step and manage questions later.
        </span>
      </div>
      {/* Manual Add Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text mb-2">
          Add Screening Question Manually
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={manualQuestion}
            onChange={(e) => setManualQuestion(e.target.value)}
            placeholder="Type your screening question..."
            className="flex-1 px-3 py-2 border border-gray-light rounded"
          />
          <Button type="button" onClick={handleAddManualQuestion} className="!px-4">
            Add
          </Button>
        </div>
        {manualQuestions.length > 0 && (
          <ul className="list-disc pl-6 mt-2 text-sm">
            {manualQuestions.map((q, idx) => (
              <li key={idx} className="mb-1">
                {q}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* AI/Auto Section */}
      <div className="mb-6">
        <QuestionManager jobId={jobId} />
      </div>
      <div className="flex justify-between mt-8">
        <Button type="button" onClick={onPrev} className="min-w-[120px]">
          Back
        </Button>
        <Button type="button" onClick={onFinish} className="min-w-[120px]">
          Finish
        </Button>
      </div>
    </div>
  );
};

export default JobCreateStep3;
