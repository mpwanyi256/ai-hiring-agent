import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Trait } from '@/types/jobs';
import { fetchTraits } from './traitsThunks';

export interface TraitsState {
  traits: Trait[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: TraitsState = {
  traits: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

const traitsSlice = createSlice({
  name: 'traits',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTraits: (state) => {
      state.traits = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Traits
      .addCase(fetchTraits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTraits.fulfilled, (state, action: PayloadAction<Trait[]>) => {
        state.isLoading = false;
        state.traits = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTraits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch traits';
      });
  },
});

export const { clearError, clearTraits } = traitsSlice.actions;
export default traitsSlice.reducer; 