import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LandingState {
  demoRequest: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
  waitlist: {
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
}

const initialState: LandingState = {
  demoRequest: {
    isLoading: false,
    error: null,
    success: false,
  },
  waitlist: {
    isLoading: false,
    error: null,
    success: false,
  },
};

const landingSlice = createSlice({
  name: 'landing',
  initialState,
  reducers: {
    // Demo Request Actions
    requestDemoStart: (state) => {
      state.demoRequest.isLoading = true;
      state.demoRequest.error = null;
      state.demoRequest.success = false;
    },
    requestDemoSuccess: (state) => {
      state.demoRequest.isLoading = false;
      state.demoRequest.error = null;
      state.demoRequest.success = true;
    },
    requestDemoFailure: (state, action: PayloadAction<string>) => {
      state.demoRequest.isLoading = false;
      state.demoRequest.error = action.payload;
      state.demoRequest.success = false;
    },
    resetDemoRequest: (state) => {
      state.demoRequest = initialState.demoRequest;
    },

    // Waitlist Actions
    joinWaitlistStart: (state) => {
      state.waitlist.isLoading = true;
      state.waitlist.error = null;
      state.waitlist.success = false;
    },
    joinWaitlistSuccess: (state) => {
      state.waitlist.isLoading = false;
      state.waitlist.error = null;
      state.waitlist.success = true;
    },
    joinWaitlistFailure: (state, action: PayloadAction<string>) => {
      state.waitlist.isLoading = false;
      state.waitlist.error = action.payload;
      state.waitlist.success = false;
    },
    resetWaitlist: (state) => {
      state.waitlist = initialState.waitlist;
    },
  },
});

export const {
  requestDemoStart,
  requestDemoSuccess,
  requestDemoFailure,
  resetDemoRequest,
  joinWaitlistStart,
  joinWaitlistSuccess,
  joinWaitlistFailure,
  resetWaitlist,
} = landingSlice.actions;

export default landingSlice.reducer;
