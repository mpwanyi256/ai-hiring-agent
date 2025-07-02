import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Trait } from '@/types/jobs';

// Fetch all traits
export const fetchTraits = createAsyncThunk(
  'traits/fetchTraits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<{ traits: Trait[] }>('/api/traits');
      return response.traits;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch traits');
    }
  }
); 