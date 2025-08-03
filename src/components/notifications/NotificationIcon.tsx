import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  User,
  FileText,
  Calendar,
  Settings,
} from 'lucide-react';

interface NotificationIconProps {
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'candidate' | 'contract' | 'interview' | 'system';
  className?: string;
}

const getNotificationIcon = (type: string, category: string, className: string) => {
  if (category === 'candidate') return <User className={className} />;
  if (category === 'contract') return <FileText className={className} />;
  if (category === 'interview') return <Calendar className={className} />;
  if (category === 'system') return <Settings className={className} />;

  switch (type) {
    case 'success':
      return <CheckCircle className={className} />;
    case 'warning':
      return <AlertTriangle className={className} />;
    case 'error':
      return <XCircle className={className} />;
    default:
      return <Info className={className} />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-blue-600 bg-blue-50';
  }
};

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  type,
  category,
  className = 'h-4 w-4',
}) => {
  return (
    <div className={`p-1.5 rounded-full ${getNotificationColor(type)} flex-shrink-0`}>
      {getNotificationIcon(type, category, className)}
    </div>
  );
};
