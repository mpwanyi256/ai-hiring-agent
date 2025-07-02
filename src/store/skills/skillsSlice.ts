import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Skill } from '@/types/jobs';
import { fetchSkills } from './skillsThunks';

export interface SkillsState {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: SkillsState = {
  skills: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSkills: (state) => {
      state.skills = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Skills
      .addCase(fetchSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action: PayloadAction<Skill[]>) => {
        state.isLoading = false;
        state.skills = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch skills';
      });
  },
});

export const { clearError, clearSkills } = skillsSlice.actions;
export default skillsSlice.reducer; 