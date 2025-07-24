import React from 'react';
import { MessageCircle, Users } from 'lucide-react';

interface EmptyStateProps {
  candidateName?: string;
  onStartConversation?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  candidateName = 'this job',
  onStartConversation,
}) => {
  return (
    <div className="text-center py-6 px-4">
      <div className="bg-blue-50 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
        <MessageCircle className="h-6 w-6 text-blue-500" />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-2">Start the conversation</h3>

      <p className="text-sm text-gray-600 mb-4 max-w-xs mx-auto">
        No messages yet for {candidateName}. Start discussing with your team.
      </p>

      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>Team collaboration</span>
        </div>
        <div className="flex items-center space-x-1">
          <MessageCircle className="h-3 w-3" />
          <span>Real-time discussion</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
