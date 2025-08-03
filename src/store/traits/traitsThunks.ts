import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Trait } from '@/types/jobs';

// Response type interfaces
interface TraitsResponse {
  traits: Trait[];
}

interface CreateTraitRequest {
  name: string;
  description?: string;
  categoryId?: string;
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

// Create new trait
export const createTrait = createAsyncThunk(
  'traits/createTrait',
  async (traitData: CreateTraitRequest) => {
    try {
      const response = await apiUtils.post<{ trait: Trait }>('/api/traits', traitData);
      return response.trait;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create trait');
    }
  },
);
