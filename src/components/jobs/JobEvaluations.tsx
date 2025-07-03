'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, StarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CurrentJob } from '@/types';

interface JobEvaluationsProps {
  job: CurrentJob;
}

export default function JobEvaluations({ job }: JobEvaluationsProps) {
  const [evaluations, setEvaluations] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch evaluations and analytics for this job
    // This is a placeholder implementation
    setIsLoading(false);
    setEvaluations([]);
  }, [job.id]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">Loading evaluations...</span>
        </div>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
        <ChartBarIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">No Evaluations Yet</h3>
        <p className="text-muted-text mb-6">
          AI evaluations will appear here once candidates complete their interviews.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2">AI Evaluation Features</h4>
          <ul className="text-blue-700 text-sm space-y-1 text-left max-w-md mx-auto">
            <li>• Automated scoring and ranking</li>
            <li>• Skills and traits assessment</li>
            <li>• Strengths and red flags identification</li>
            <li>• Hiring recommendations</li>
          </ul>
        </div>
        
        <Button variant="outline" className="flex items-center mx-auto">
          <DocumentTextIcon className="w-4 h-4 mr-2" />
          Learn About AI Evaluation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evaluation Analytics */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Evaluation Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-text">0</div>
            <div className="text-sm text-muted-text">Total Evaluated</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">--</div>
            <div className="text-sm text-muted-text">Average Score</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-text">Recommended</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-muted-text">Need Review</div>
          </div>
        </div>
      </div>

      {/* Top Candidates */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">Top Candidates</h2>
          <Button variant="outline" size="sm">
            <StarIcon className="w-4 h-4 mr-1" />
            View All Rankings
          </Button>
        </div>
        
        <div className="text-center py-8 text-muted-text">
          Top performing candidates will be displayed here based on AI evaluation scores.
        </div>
      </div>

      {/* Evaluation Insights */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Evaluation Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-text mb-3">Skills Assessment</h3>
            <div className="text-center py-6 text-muted-text">
              Skills distribution chart will appear here
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-text mb-3">Common Strengths</h3>
            <div className="text-center py-6 text-muted-text">
              Common strengths analysis will appear here
            </div>
          </div>
        </div>
      </div>

      {/* Export & Actions */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Export & Reports</h2>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled>
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
          <Button variant="outline" disabled>
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
        
        <p className="text-muted-text text-sm mt-3">
          Export and reporting features will be available once evaluations are completed.
        </p>
      </div>
    </div>
  );
} 