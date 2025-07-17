// Interview Scheduling Types

export interface Country {
  id: string;
  name: string;
  code: string;
  continent: string;
  createdAt: string;
}

export interface Timezone {
  id: string;
  name: string;
  displayName: string;
  offsetHours: number;
  offsetMinutes: number;
  isDst: boolean;
  region: string;
  countryId?: string; // Reference to countries.id
  country?: Country; // Populated when joining with countries table
  city?: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string; // Links to candidates.id
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  timezoneId: string; // Reference to timezones.id
  timezone?: Timezone; // Populated when joining with timezones table
  duration: number; // in minutes
  calendarEventId?: string; // Google Calendar event ID
  meetLink?: string; // Video meeting link
  status: InterviewStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InterviewStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface CreateInterviewData {
  applicationId: string; // Changed from candidateId
  jobId: string;
  date: string;
  time: string;
  timezoneId: string; // Changed from timezone string
  duration: number;
  notes?: string;
  employerEmail?: string; // Added for calendar attendee
}

export interface UpdateInterviewData {
  id: string;
  date?: string;
  time?: string;
  timezoneId?: string; // Changed from timezone string
  duration?: number;
  notes?: string;
  status?: InterviewStatus;
}

export interface InterviewFilters {
  jobId?: string;
  applicationId?: string; // Changed from candidateId
  status?: InterviewStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface InterviewsState {
  interviews: Interview[];
  currentInterview: Interview | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  // Scheduling state
  scheduling: {
    isScheduling: boolean;
    schedulingApplicationId: string | null; // Changed from schedulingCandidateId
    isUpdating: boolean;
    updatingInterviewId: string | null;
  };
}

// API Response Types
export interface InterviewsListResponse {
  success: boolean;
  interviews: Interview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface InterviewDetailResponse {
  success: boolean;
  interview: Interview;
  error?: string;
}

export interface CreateInterviewResponse {
  success: boolean;
  interview: Interview;
  error?: string;
}

export interface UpdateInterviewResponse {
  success: boolean;
  interview: Interview;
  error?: string;
}

export interface DeleteInterviewResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Google Calendar Integration Types
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    entryPoints: Array<{
      uri: string;
      entryPointType: string;
    }>;
  };
}

export interface CreateCalendarEventData {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  attendeeEmail: string;
  attendeeName?: string;
}

// Timezone and Date Utilities
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
  country?: Country;
  city?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  label: string;
}

export interface DateAvailability {
  date: string;
  available: boolean;
  slots: TimeSlot[];
}

export interface InterviewConflict {
  id: string;
  candidate_name: string;
  job_title: string;
  date: string;
  time: string;
}

export interface CheckConflictsPayload {
  candidateId: string;
  jobId: string;
  date: string;
  time: string;
  timezone: string;
  excludeInterviewId: string;
}
