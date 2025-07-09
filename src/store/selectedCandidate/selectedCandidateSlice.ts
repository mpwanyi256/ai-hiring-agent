import { SelectedCandidateState } from '@/types/selectedCandidate';
import { createSlice } from '@reduxjs/toolkit';

const initialState: SelectedCandidateState = {
  candidate: null,
};

const selectedCandidateSlice = createSlice({
  name: 'selectedCandidate',
  initialState,
  reducers: {
    setSelectedCandidate: (state, action) => {
      state.candidate = action.payload;
    },
  },
});

export const { setSelectedCandidate } = selectedCandidateSlice.actions;

export default selectedCandidateSlice.reducer;
