import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { AppDispatch } from '@/store';
import { fetchCandidateTimeline } from '@/store/interviews/interviewsThunks';
import {
  selectTimelineEvents,
  selectTimelineLoading,
  selectTimelineError,
} from '@/store/interviews/interviewsSelectors';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Video,
  Users,
  Award,
  TrendingUp,
  FileSignature,
} from 'lucide-react';
import { TimelineEvent } from '@/types/notifications';

interface CandidateTimelineProps {
  candidateId: string;
}

const getEventIcon = (type: TimelineEvent['type'], status?: string) => {
  const iconClass = 'h-4 w-4';

  switch (type) {
    case 'application':
      return <UserPlus className={iconClass} />;
    case 'evaluation':
      return <Star className={iconClass} />;
    case 'interview':
      return <Video className={iconClass} />;
    case 'contract':
      return <FileSignature className={iconClass} />;
    case 'status_change':
      return status === 'success' ? (
        <CheckCircle className={iconClass} />
      ) : status === 'error' ? (
        <XCircle className={iconClass} />
      ) : (
        <TrendingUp className={iconClass} />
      );
    case 'note':
      return <MessageSquare className={iconClass} />;
    case 'email':
      return <Mail className={iconClass} />;
    case 'call':
      return <Phone className={iconClass} />;
    case 'meeting':
      return <Users className={iconClass} />;
    case 'assessment':
      return <Award className={iconClass} />;
    case 'reference':
      return <CheckCircle className={iconClass} />;
    case 'offer':
      return <Briefcase className={iconClass} />;
    default:
      return <Clock className={iconClass} />;
  }
};

const getEventColor = (type: TimelineEvent['type'], status?: string) => {
  if (status === 'success') return 'text-green-600 bg-green-50 border-green-200';
  if (status === 'error') return 'text-red-600 bg-red-50 border-red-200';
  if (status === 'warning') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (status === 'pending') return 'text-blue-600 bg-blue-50 border-blue-200';

  switch (type) {
    case 'application':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'evaluation':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'interview':
      return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    case 'contract':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'status_change':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'note':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'email':
      return 'text-cyan-600 bg-cyan-50 border-cyan-200';
    case 'call':
      return 'text-teal-600 bg-teal-50 border-teal-200';
    case 'meeting':
      return 'text-violet-600 bg-violet-50 border-violet-200';
    case 'assessment':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'reference':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'offer':
      return 'text-rose-600 bg-rose-50 border-rose-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.info}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function CandidateTimeline({ candidateId }: CandidateTimelineProps) {
  const dispatch = useDispatch<AppDispatch>();
  const events = useSelector(selectTimelineEvents);
  const loading = useSelector(selectTimelineLoading);
  const error = useSelector(selectTimelineError);

  useEffect(() => {
    if (candidateId) {
      dispatch(fetchCandidateTimeline(candidateId));
    }
  }, [dispatch, candidateId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No timeline events found</p>
            <p className="text-sm text-gray-400 mt-1">Events will appear here as they occur</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline ({events.length} events)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedEvents.map((event, index) => {
            const isLast = index === sortedEvents.length - 1;
            const colorClasses = getEventColor(event.type, event.status);

            return (
              <div key={event.id} className="relative flex gap-4 border-b border-gray-200">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 -z-10"></div>
                )}

                {/* Event icon */}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${colorClasses}`}
                >
                  {getEventIcon(event.type, event.status)}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      {getStatusBadge(event.status)}
                    </div>
                    <time className="text-xs text-gray-500 flex-shrink-0">
                      {formatDateTime(event.timestamp)}
                    </time>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}

                  {event.performer && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <span>by</span>
                      <span className="font-medium">{event.performer.name}</span>
                      {event.performer.role && (
                        <span className="text-gray-400">({event.performer.role})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
