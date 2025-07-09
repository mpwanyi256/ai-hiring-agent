import { AnalyticsData } from '@/types/analytics';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';

export const fetchSelectedCandidateAnalytics = createAsyncThunk<AnalyticsData>(
  'selectedCandidate/fetchSelectedCandidateAnalytics',
  async (_, { rejectWithValue, getState }) => {
    try {
      const selectedCandidate = (getState() as RootState).selectedCandidate.candidate;
      if (!selectedCandidate) {
        throw new Error('No candidate selected');
      }

      const { id: candidateId, jobId } = selectedCandidate;

      const response = await fetch(`/api/candidates/${candidateId}/analytics?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch candidate analytics');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
