import { SelectedCandidateState } from '@/types/selectedCandidate';
import { createSlice } from '@reduxjs/toolkit';
import { fetchSelectedCandidateAnalytics } from './selectedCandidateThunks';
import { updateCandidateStatus } from '../candidates/candidatesThunks';

const initialState: SelectedCandidateState = {
  candidate: null,
  candidateAnalytics: null,
};

const selectedCandidateSlice = createSlice({
  name: 'selectedCandidate',
  initialState,
  reducers: {
    setSelectedCandidate: (state, action) => {
      state.candidate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateCandidateStatus.fulfilled, (state, action) => {
      if (state.candidate && state.candidate.id === action.payload.id) {
        state.candidate = { ...state.candidate, candidateStatus: action.payload.status };
      }
    });
    builder.addCase(fetchSelectedCandidateAnalytics.fulfilled, (state, action) => {
      state.candidateAnalytics = action.payload;
    });
    builder.addCase(fetchSelectedCandidateAnalytics.rejected, (state) => {
      state.candidateAnalytics = null;
    });
  },
});

export const { setSelectedCandidate } = selectedCandidateSlice.actions;

export default selectedCandidateSlice.reducer;
