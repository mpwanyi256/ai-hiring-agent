'use client';

import { useState, useEffect } from 'react';
import { JobData } from '@/lib/services/jobsService';
import { UserGroupIcon, EyeIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface JobCandidatesProps {
  job: JobData;
}

export default function JobCandidates({ job }: JobCandidatesProps) {
  const [candidates, setCandidates] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch candidates for this job
    // This is a placeholder implementation
    setIsLoading(false);
    setCandidates([]);
  }, [job.id]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">Loading candidates...</span>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
        <UserGroupIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">No Candidates Yet</h3>
        <p className="text-muted-text mb-6">
          Once candidates complete interviews for this position, they&apos;ll appear here.
        </p>
        
        {job.status === 'draft' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700 text-sm">
              <CheckBadgeIcon className="w-4 h-4 inline mr-1" />
              Start interviewing to accept candidate applications for this job.
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="flex items-center">
            <EyeIcon className="w-4 h-4 mr-2" />
            Preview Interview
          </Button>
          {job.interviewLink && (
            <Button 
              onClick={() => navigator.clipboard.writeText(job.interviewLink!)}
              className="flex items-center"
            >
              Share Interview Link
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidates Stats */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Candidate Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-text">{job.candidateCount || 0}</div>
            <div className="text-sm text-muted-text">Total Applications</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-muted-text">In Progress</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-muted-text">Completed</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-sm text-muted-text">Recommended</div>
          </div>
        </div>
      </div>

      {/* Candidates List Placeholder */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Candidate Applications</h2>
        <p className="text-muted-text text-center py-8">
          Candidate management interface will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
} 