import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Trait } from '@/types/jobs';

// Response type interface
interface TraitsResponse {
  traits: Trait[];
}

// Fetch all traits
export const fetchTraits = createAsyncThunk('traits/fetchTraits', async () => {
  try {
    const response = await apiUtils.get<TraitsResponse>('/api/traits');
    return response.traits;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch traits');
  }
});
