import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { JobData } from '@/lib/services/jobsService';
import { APIResponse, CandidateBasic } from '@/types';
import { createCandidateAccountPayload } from '@/types/interview';

export const fetchInterview = createAsyncThunk(
  'interview/fetchInterview',
  async (token: string): Promise<JobData> => {
    const response = await fetch(`/api/jobs/interview/${token}`);

    if (!response.ok) {
      throw new Error('Failed to fetch interview');
    }

    const data = (await response.json()) as APIResponse<JobData>;

    return data.data;
  },
);

export const getCandidateDetails = createAsyncThunk(
  'interview/getCandidateDetails',
  async ({
    jobToken,
    email,
    firstName,
    lastName,
  }: createCandidateAccountPayload): Promise<CandidateBasic> => {
    const { data } = await apiUtils.post<APIResponse<CandidateBasic>>(`/api/candidates`, {
      jobToken,
      email,
      firstName,
      lastName,
    });

    return data;
  },
);

export const rescheduleInterview = createAsyncThunk(
  'interview/rescheduleInterview',
  async ({
    interviewId,
    date,
    time,
    timezoneId,
    timezoneName,
    notes,
  }: {
    interviewId: string;
    date: string;
    time: string;
    timezoneId: string;
    timezoneName?: string;
    notes?: string;
  }) => {
    const response = await fetch(`/api/interviews/${interviewId}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time, timezoneId, timezoneName, notes }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to reschedule interview');
    }
    return data;
  },
);

export const cancelInterview = createAsyncThunk(
  'interview/cancelInterview',
  async ({ interviewId }: { interviewId: string }) => {
    const response = await fetch(`/api/interviews/${interviewId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to cancel interview');
    }
    return data;
  },
);
