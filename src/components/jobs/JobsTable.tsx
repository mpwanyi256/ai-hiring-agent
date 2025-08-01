'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  EyeIcon,
  LinkIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '@/store';
import { selectCompanyJobs } from '@/store/jobs/jobsSelectors';
import { CompanyJobs, JobField } from '@/types';
import { getJobStatusColor } from '@/lib/utils';

interface JobsTableProps {
  onCopyLink: (job: CompanyJobs) => void;
  isLoading?: boolean;
}

export default function JobsTable({ onCopyLink, isLoading }: JobsTableProps) {
  const { jobs } = useAppSelector(selectCompanyJobs);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
        <div className="text-gray-400 mb-3">
          <CalendarIcon className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidates
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Format
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {job.title}
                    </Link>
                    {job.fields?.experienceLevel && (
                      <span className="text-xs text-gray-500 mt-0.5 capitalize">
                        {job.fields['experienceLevel']?.value}
                      </span>
                    )}
                    {job.fields?.skills && job.fields.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.fields.skills.slice(0, 2).map((skill: JobField, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary"
                          >
                            {skill.value}
                          </span>
                        ))}
                        {job.fields.skills.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{job.fields.skills.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobStatusColor(job.status)}`}
                    >
                      {job.status}
                    </span>
                    <span
                      className={`text-xs ${job.is_active ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {job.candidate_count || 0}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{formatDate(job.created_at)}</span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span className="text-sm text-gray-500 capitalize">
                    {job.interview_format === 'text' ? 'Text' : 'Video'}
                  </span>
                </td>

                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <EyeIcon className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => onCopyLink(job)}
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Copy interview link
                    </Button>

                    {/* {job.candidateCount && job.candidateCount > 0 && (
                      <Link href={`/dashboard/candidates?job=${job.id}`}>
                        <Button size="sm" className="text-xs">
                          <UserGroupIcon className="w-3 h-3 mr-1" />
                          Candidates
                        </Button>
                      </Link>
                    )} */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
