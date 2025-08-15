import { SelectedCandidateState } from '@/types/selectedCandidate';
import { createSlice } from '@reduxjs/toolkit';
import {
  fetchSelectedCandidateAnalytics,
  fetchSelectedCandidateDetails,
  fetchSelectedCandidateContractOffers,
} from './selectedCandidateThunks';
import { fetchJobCandidates, updateCandidateStatus } from '../candidates/candidatesThunks';

const initialState: SelectedCandidateState = {
  candidate: null,
  candidateAnalytics: null,
  isLoading: false,
  contractOffers: [],
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
      state.isLoading = false;
      state.contractOffers = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSelectedCandidateContractOffers.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchSelectedCandidateContractOffers.fulfilled, (state, action) => {
      state.contractOffers = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchSelectedCandidateContractOffers.rejected, (state) => {
      state.contractOffers = null;
      state.isLoading = false;
    });
    builder.addCase(fetchJobCandidates.pending, (state) => {
      state.candidate = null;
      state.candidateAnalytics = null;
      state.isLoading = false;
    });
    builder.addCase(fetchSelectedCandidateDetails.pending, (state) => {
      state.isLoading = true;
      state.candidateAnalytics = null;
    });
    builder.addCase(fetchSelectedCandidateDetails.fulfilled, (state, action) => {
      state.candidate = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchSelectedCandidateDetails.rejected, (state) => {
      state.candidate = null;
      state.isLoading = false;
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
