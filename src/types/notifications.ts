export interface TimelineEvent {
  id: string;
  type:
    | 'application'
    | 'evaluation'
    | 'interview'
    | 'contract'
    | 'status_change'
    | 'note'
    | 'email'
    | 'call'
    | 'meeting'
    | 'assessment'
    | 'reference'
    | 'offer';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info' | 'pending';
  metadata?: Record<string, any>;
  performer?: {
    name: string;
    role?: string;
    avatar?: string;
  };
}

export interface TimelineEventsResponse {
  success: boolean;
  error: string | null;
  events: TimelineEvent[];
  total: number;
}

// interface TimelineEvent {
//   id: string;
//   type: string;
//   title: string;
//   description?: string;
//   timestamp: string;
//   status?: string;
//   metadata?: Record<string, any>;
//   performer?: {
//     name: string;
//     role?: string;
//   };
// }
