import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  CreateInterviewData,
  UpdateInterviewData,
  InterviewFilters,
  InterviewStatus,
  InterviewsListResponse,
  InterviewDetailResponse,
  CreateInterviewResponse,
  UpdateInterviewResponse,
  DeleteInterviewResponse,
  Event,
} from '@/types/interviews';
import { RootState } from '..';
import { apiUtils } from '../api';
import { APIResponse } from '@/types';
import { TimelineEventsResponse } from '@/types/notifications';

// Fetch interviews with filters
export const fetchInterviews = createAsyncThunk(
  'interviews/fetchInterviews',
  async (filters: InterviewFilters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      if (filters.jobId) params.append('jobId', filters.jobId);
      if (filters.applicationId) params.append('applicationId', filters.applicationId);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/interviews?${params}`);
      const data: InterviewsListResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch interviews');
      }

      return data;
    } catch {
      return rejectWithValue('Failed to fetch interviews');
    }
  },
);

// Create new interview
export const createInterview = createAsyncThunk(
  'interviews/createInterview',
  async (interviewData: CreateInterviewData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });

      const data: CreateInterviewResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to create interview');
      }

      return data;
    } catch {
      return rejectWithValue('Failed to create interview');
    }
  },
);

// Update existing interview
export const updateInterview = createAsyncThunk(
  'interviews/updateInterview',
  async (updateData: UpdateInterviewData, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/interviews/${updateData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data: UpdateInterviewResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to update interview');
      }

      return data;
    } catch {
      return rejectWithValue('Failed to update interview');
    }
  },
);

// Delete interview
export const deleteInterview = createAsyncThunk(
  'interviews/deleteInterview',
  async (interviewId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
      });

      const data: DeleteInterviewResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to delete interview');
      }

      return { interviewId, message: data.message };
    } catch {
      return rejectWithValue('Failed to delete interview');
    }
  },
);

// Schedule interview (alias for createInterview with additional logic)
export const scheduleInterview = createAsyncThunk(
  'interviews/scheduleInterview',
  async (interviewData: CreateInterviewData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      // This could include additional logic like Google Calendar integration
      const response = await fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interviewData,
          userId: user.id,
          companyId: user.companyId,
          organizerEmail: user.email,
          companyName: user.companyName,
        }),
      });

      const data: CreateInterviewResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to schedule interview');
      }

      return data;
    } catch {
      return rejectWithValue('Failed to schedule interview');
    }
  },
);

// Update interview status
export const updateInterviewStatus = createAsyncThunk(
  'interviews/updateInterviewStatus',
  async (
    { interviewId, status }: { interviewId: string; status: InterviewStatus },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data: UpdateInterviewResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to update interview status');
      }

      return data;
    } catch {
      return rejectWithValue('Failed to update interview status');
    }
  },
);

// Fetch single interview details
export const fetchInterviewDetails = createAsyncThunk(
  'interviews/fetchInterviewDetails',
  async (interviewId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}`);
      const data: InterviewDetailResponse = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch interview details');
      }

      return data;
    } catch {
      return rejectWithValue('Failed to fetch interview details');
    }
  },
);

// Fetch candidate timeline events
export const fetchCandidateTimeline = createAsyncThunk(
  'interviews/fetchCandidateTimeline',
  async (candidateId: string, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<TimelineEventsResponse>(
        `/api/candidates/${candidateId}/timeline`,
      );

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch candidate timeline');
      }

      return response.events;
    } catch {
      return rejectWithValue('Failed to fetch candidate timeline');
    }
  },
);

// Get interview availability for a candidate
export const getInterviewAvailability = createAsyncThunk(
  'interviews/getAvailability',
  async (
    { applicationId, jobId }: { applicationId: string; jobId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(
        `/api/interviews/availability?applicationId=${applicationId}&jobId=${jobId}`,
      );
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to get availability');
      }

      return data.availability;
    } catch {
      return rejectWithValue('Failed to get availability');
    }
  },
);

export const cancelInterview = createAsyncThunk(
  'interviews/cancelInterview',
  async ({ interviewId }: { interviewId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to cancel interview');
      }
      return data.interview;
    } catch {
      return rejectWithValue('Failed to cancel interview');
    }
  },
);

export const fetchApplicationEvents = createAsyncThunk(
  'interviews/fetchApplicationEvents',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const { data, success, error } = await apiUtils.get<APIResponse<Event[]>>(
        `/api/applications/${applicationId}/events`,
      );
      if (!success) {
        return rejectWithValue(error || 'Failed to fetch application events');
      }
      return data;
    } catch {
      return rejectWithValue('Failed to fetch application events');
    }
  },
);
