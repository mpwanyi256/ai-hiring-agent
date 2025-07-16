export interface InterviewEmailData {
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
