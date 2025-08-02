'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  User,
  FileText,
  Calendar,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

const getNotificationIcon = (type: string, category: string) => {
  const iconClass = 'h-5 w-5';

  if (category === 'candidate') return <User className={iconClass} />;
  if (category === 'contract') return <FileText className={iconClass} />;
  if (category === 'interview') return <Calendar className={iconClass} />;
  if (category === 'system') return <Settings className={iconClass} />;

  switch (type) {
    case 'success':
      return <CheckCircle className={iconClass} />;
    case 'warning':
      return <AlertTriangle className={iconClass} />;
    case 'error':
      return <XCircle className={iconClass} />;
    default:
      return <Info className={iconClass} />;
  }
};

const getNotificationColor = (type: string, isRead: boolean) => {
  const opacity = isRead ? 'opacity-60' : '';

  switch (type) {
    case 'success':
      return `text-green-600 bg-green-50 border-green-200 ${opacity}`;
    case 'warning':
      return `text-yellow-600 bg-yellow-50 border-yellow-200 ${opacity}`;
    case 'error':
      return `text-red-600 bg-red-50 border-red-200 ${opacity}`;
    default:
      return `text-blue-600 bg-blue-50 border-blue-200 ${opacity}`;
  }
};

const getTypeBadge = (type: string) => {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <Badge variant="outline" className={variants[type as keyof typeof variants] || variants.info}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

// Mock data - this would come from API in real implementation
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    category: 'contract',
    title: 'Contract Signed',
    message: 'John Doe has signed the employment contract',
    actionUrl: '/dashboard/jobs/job-1/candidates/candidate-1',
    actionText: 'View Details',
    isRead: false,
    createdAt: '2024-01-25T14:30:00Z',
  },
  {
    id: '2',
    type: 'info',
    category: 'candidate',
    title: 'New Application',
    message: 'Jane Smith applied for Senior Developer position',
    actionUrl: '/dashboard/jobs/job-2/candidates/candidate-2',
    actionText: 'Review Application',
    isRead: false,
    createdAt: '2024-01-25T12:15:00Z',
  },
  {
    id: '3',
    type: 'warning',
    category: 'contract',
    title: 'Contract Expiring Soon',
    message: 'Contract offer for Mike Johnson expires in 2 days',
    actionUrl: '/dashboard/jobs/job-1/candidates/candidate-3',
    actionText: 'Extend Offer',
    isRead: true,
    createdAt: '2024-01-24T16:45:00Z',
    readAt: '2024-01-24T17:00:00Z',
  },
  {
    id: '4',
    type: 'info',
    category: 'interview',
    title: 'Interview Scheduled',
    message: 'Technical interview scheduled with Sarah Wilson for tomorrow at 2 PM',
    actionUrl: '/dashboard/interviews/interview-1',
    actionText: 'View Interview',
    isRead: true,
    createdAt: '2024-01-24T10:20:00Z',
    readAt: '2024-01-24T10:25:00Z',
  },
  {
    id: '5',
    type: 'error',
    category: 'system',
    title: 'Email Delivery Failed',
    message: 'Failed to send interview invitation to candidate@example.com',
    isRead: false,
    createdAt: '2024-01-23T09:30:00Z',
  },
];

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    const matchesReadStatus = !showUnreadOnly || !notification.isRead;

    return matchesSearch && matchesType && matchesCategory && matchesReadStatus;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationIds: string[]) => {
    setLoading(true);
    try {
      // API call would go here
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification,
        ),
      );
      toast.success(`Marked ${notificationIds.length} notification(s) as read`);
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setLoading(true);
    try {
      // API call would go here
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.actionUrl) {
      // Mark as read when clicking action
      if (!notification.isRead) {
        markAsRead([notification.id]);
      }
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      rightNode={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={loading || unreadCount === 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Mark All Read
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="candidate">Candidate</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showUnreadOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Unread Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all' || showUnreadOnly
                    ? 'Try adjusting your filters to see more notifications.'
                    : "You're all caught up! New notifications will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  notification.isRead ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-full border ${getNotificationColor(notification.type, notification.isRead)}`}
                    >
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}
                          >
                            {notification.title}
                          </h4>
                          {getTypeBadge(notification.type)}
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                        <time
                          className={`text-xs flex-shrink-0 ${notification.isRead ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {formatDateTime(notification.createdAt)}
                        </time>
                      </div>

                      <p
                        className={`text-sm mb-3 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}
                      >
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(notification)}
                              className="text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {notification.actionText || 'View'}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead([notification.id])}
                              className="text-xs px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
