// Interview-related types

// Database enum values - must match the PostgreSQL enums exactly
export type InterviewType = 'video' | 'phone' | 'in_person';

export type InterviewScheduleStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface InterviewSchedule {
  id: string;
  candidateId: string;
  jobId: string;
  scheduledDate: string;
  durationMinutes: number;
  interviewType: InterviewType;
  location?: string;
  notes?: string;
  status: InterviewScheduleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewScheduleRequest {
  candidateId: string;
  date: string;
  time: string;
  duration: number;
  type: InterviewType;
  location?: string;
  notes?: string;
}

export interface CreateInterviewScheduleResponse {
  success: boolean;
  interview: {
    id: string;
    scheduledDate: string;
    duration: number;
    type: InterviewType;
    status: InterviewScheduleStatus;
  };
  error?: string;
} 