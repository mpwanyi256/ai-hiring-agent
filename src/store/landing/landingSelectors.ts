import { RootState } from '../index';

// Demo Request Selectors
export const selectDemoRequest = (state: RootState) => state.landing.demoRequest;
export const selectDemoRequestLoading = (state: RootState) => state.landing.demoRequest.isLoading;
export const selectDemoRequestError = (state: RootState) => state.landing.demoRequest.error;
export const selectDemoRequestSuccess = (state: RootState) => state.landing.demoRequest.success;

// Waitlist Selectors
export const selectWaitlist = (state: RootState) => state.landing.waitlist;
export const selectWaitlistLoading = (state: RootState) => state.landing.waitlist.isLoading;
export const selectWaitlistError = (state: RootState) => state.landing.waitlist.error;
export const selectWaitlistSuccess = (state: RootState) => state.landing.waitlist.success;
