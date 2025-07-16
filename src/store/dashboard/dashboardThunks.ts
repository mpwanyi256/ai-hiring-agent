import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setError, setUpcomingInterviews, UpcomingInterview } from './dashboardSlice';

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
