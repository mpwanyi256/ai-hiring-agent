import { SelectedCandidateState } from '@/types/selectedCandidate';
import { createSlice } from '@reduxjs/toolkit';
import {
  fetchSelectedCandidateAnalytics,
  fetchSelectedCandidateDetails,
} from './selectedCandidateThunks';
import { fetchJobCandidates, updateCandidateStatus } from '../candidates/candidatesThunks';

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
    resetSelectedCandidate: (state) => {
      state.candidate = null;
      state.candidateAnalytics = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchJobCandidates.pending, (state) => {
      state.candidate = null;
      state.candidateAnalytics = null;
    });
    builder.addCase(fetchSelectedCandidateDetails.pending, (state) => {
      state.candidateAnalytics = null;
    });
    builder.addCase(fetchSelectedCandidateDetails.fulfilled, (state, action) => {
      state.candidate = action.payload;
    });
    builder.addCase(fetchSelectedCandidateDetails.rejected, (state) => {
      state.candidate = null;
    });
    builder.addCase(updateCandidateStatus.fulfilled, (state, action) => {
      if (state.candidate && state.candidate.id === action.payload.id) {
        state.candidate = { ...state.candidate, candidateStatus: action.payload.status } as any;
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
