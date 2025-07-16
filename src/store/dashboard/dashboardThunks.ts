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
  setRecentActivity,
  setRecentActivityLoading,
  setRecentActivityError,
  RecentActivityItem,
} from './dashboardSlice';
import { RootState } from '@/store';

export const fetchUpcomingInterviews = createAsyncThunk<
  UpcomingInterview[],
  { limit?: number },
  { rejectValue: string }
>(
  'dashboard/fetchUpcomingInterviews',
  async ({ limit = 5 }, { dispatch, rejectWithValue, getState }) => {
    const user = (getState() as RootState).auth.user;
    if (!user) {
      return rejectWithValue('User not found');
    }
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const res = await fetch(
        `/api/interviews/upcoming?companyId=${user.companyId}&limit=${limit}`,
      );
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
  void,
  { rejectValue: string }
>('dashboard/fetchCandidatePipeline', async (_, { dispatch, rejectWithValue, getState }) => {
  const user = (getState() as RootState).auth.user;
  if (!user) {
    return rejectWithValue('User not found');
  }

  dispatch(setPipelineLoading(true));
  dispatch(setPipelineError(null));
  try {
    const res = await fetch(`/api/dashboard/candidate-pipeline?companyId=${user.companyId}`);
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

export const fetchRecentActivity = createAsyncThunk<
  RecentActivityItem[],
  { limit?: number },
  { rejectValue: string }
>(
  'dashboard/fetchRecentActivity',
  async ({ limit = 5 }, { dispatch, rejectWithValue, getState }) => {
    const user = (getState() as RootState).auth.user;
    if (!user) {
      return rejectWithValue('User not found');
    }

    dispatch(setRecentActivityLoading(true));
    dispatch(setRecentActivityError(null));
    try {
      const res = await fetch(
        `/api/dashboard/recent-activity?companyId=${user.companyId}&limit=${limit}`,
      );
      const data = await res.json();
      if (data.success) {
        dispatch(setRecentActivity(data.activities || []));
        return data.activities || [];
      } else {
        dispatch(setRecentActivityError(data.error || 'Failed to load activity'));
        return rejectWithValue(data.error || 'Failed to load activity');
      }
    } catch (err) {
      dispatch(setRecentActivityError('Failed to load activity'));
      return rejectWithValue('Failed to load activity');
    } finally {
      dispatch(setRecentActivityLoading(false));
    }
  },
);
