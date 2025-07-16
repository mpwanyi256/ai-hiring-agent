import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setLoading,
  setError,
  setUpcomingInterviews,
  UpcomingInterview,
  setCandidatePipeline,
  setPipelineLoading,
  setPipelineError,
  CandidatePipelineItem,
} from './dashboardSlice';

export const fetchUpcomingInterviews = createAsyncThunk<
  UpcomingInterview[],
  { companyId: string; limit?: number },
  { rejectValue: string }
>(
  'dashboard/fetchUpcomingInterviews',
  async ({ companyId, limit = 5 }, { dispatch, rejectWithValue }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const res = await fetch(`/api/interviews/upcoming?companyId=${companyId}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        dispatch(setUpcomingInterviews(data.interviews || []));
        return data.interviews || [];
      } else {
        dispatch(setError(data.error || 'Failed to load interviews'));
        return rejectWithValue(data.error || 'Failed to load interviews');
      }
    } catch (err) {
      dispatch(setError('Failed to load interviews'));
      return rejectWithValue('Failed to load interviews');
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const fetchCandidatePipeline = createAsyncThunk<
  CandidatePipelineItem[],
  { companyId: string },
  { rejectValue: string }
>('dashboard/fetchCandidatePipeline', async ({ companyId }, { dispatch, rejectWithValue }) => {
  dispatch(setPipelineLoading(true));
  dispatch(setPipelineError(null));
  try {
    const res = await fetch(`/api/dashboard/candidate-pipeline?companyId=${companyId}`);
    const data = await res.json();
    if (data.success) {
      dispatch(setCandidatePipeline(data.pipeline || []));
      return data.pipeline || [];
    } else {
      dispatch(setPipelineError(data.error || 'Failed to load pipeline data'));
      return rejectWithValue(data.error || 'Failed to load pipeline data');
    }
  } catch (err) {
    dispatch(setPipelineError('Failed to load pipeline data'));
    return rejectWithValue('Failed to load pipeline data');
  } finally {
    dispatch(setPipelineLoading(false));
  }
});
