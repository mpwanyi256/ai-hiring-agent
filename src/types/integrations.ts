export interface InterviewEmailData {
  eventSummary: string;
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  meetLink: string | null;
  duration: number;
  notes?: string;
  organizerEmail: string;
}

export interface CalendarEvent {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  attendees: string[];
  meetLink?: string;
}

export type IntegrationProvider = 'google' | 'slack' | 'discord';

export interface IntegrationMetadata {
  name?: string;
  email?: string;
  google_id?: string;
  [key: string]: any;
}

export interface Integration {
  id: string;
  company_id: string;
  user_id: string;
  provider: IntegrationProvider;
  access_token: string;
  refresh_token?: string;
  expires_at?: string | null;
  scope?: string;
  metadata: IntegrationMetadata;
  created_at: string;
  updated_at: string;
}
