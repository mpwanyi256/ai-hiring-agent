'use client';

import React from 'react';
import { 
  UserPlusIcon, 
  BriefcaseIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface ActivityItem {
  id: string;
  type: 'interview' | 'job_created' | 'candidate_applied' | 'evaluation_completed';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'info';
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  maxItems?: number;
}

const activityIcons = {
  interview: ChatBubbleLeftRightIcon,
  job_created: BriefcaseIcon,
  candidate_applied: UserPlusIcon,
  evaluation_completed: CheckCircleIcon,
};

const activityColors = {
  interview: { icon: 'text-blue-600', bg: 'bg-blue-50' },
  job_created: { icon: 'text-green-600', bg: 'bg-green-50' },
  candidate_applied: { icon: 'text-purple-600', bg: 'bg-purple-50' },
  evaluation_completed: { icon: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function RecentActivity({ 
  activities = [], 
  maxItems = 5 
}: RecentActivityProps) {
  // Mock data if no activities provided
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'candidate_applied',
      title: 'New candidate applied',
      description: 'John Smith applied for Senior Developer position',
      timestamp: '2 hours ago',
      status: 'info'
    },
    {
      id: '2',
      type: 'interview',
      title: 'Interview completed',
      description: 'AI interview finished for Marketing Specialist role',
      timestamp: '4 hours ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'evaluation_completed',
      title: 'Evaluation generated',
      description: 'AI evaluation completed for Sarah Johnson',
      timestamp: '6 hours ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'job_created',
      title: 'New job posted',
      description: 'Product Manager position was created',
      timestamp: '1 day ago',
      status: 'success'
    },
    {
      id: '5',
      type: 'candidate_applied',
      title: 'Candidate shortlisted',
      description: 'Alex Chen moved to shortlist for Designer role',
      timestamp: '2 days ago',
      status: 'success'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;
  const limitedActivities = displayActivities.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {limitedActivities.map((activity) => {
        const IconComponent = activityIcons[activity.type];
        const colors = activityColors[activity.type];
        
        return (
          <div key={activity.id} className="flex items-start space-x-3 group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg} flex-shrink-0`}>
              <IconComponent className={`w-4 h-4 ${colors.icon}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {activity.description}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {activity.status && (
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-400' :
                      activity.status === 'pending' ? 'bg-amber-400' :
                      'bg-blue-400'
                    }`} />
                  )}
                  <div className="flex items-center text-xs text-gray-400">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {limitedActivities.length === 0 && (
        <div className="text-center py-6">
          <ClockIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
      )}
    </div>
  );
} 