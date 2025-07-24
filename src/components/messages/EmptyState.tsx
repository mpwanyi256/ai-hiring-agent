import React from 'react';
import { MessageCircle, Users, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  candidateName?: string;
  onStartConversation?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  candidateName = 'this candidate',
  onStartConversation,
}) => {
  return (
    <div className="text-center py-12 px-6">
      <div className="bg-blue-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <MessageCircle className="h-10 w-10 text-blue-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-3">Start the conversation</h3>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        No messages yet for {candidateName}. Start discussing this candidate with your team to share
        insights, feedback, and collaborate on the hiring decision.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team collaboration</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>Real-time discussion</span>
          </div>
        </div>

        {onStartConversation && (
          <button
            onClick={onStartConversation}
            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <span>Start Discussion</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="text-center">
            <div className="font-medium text-gray-700 mb-1">Share Feedback</div>
            <p>Discuss strengths, concerns, and interview insights</p>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-700 mb-1">Collaborate</div>
            <p>Make decisions together with your hiring team</p>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-700 mb-1">Stay Organized</div>
            <p>Keep all candidate discussions in one place</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
