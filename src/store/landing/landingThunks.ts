import { createAsyncThunk } from '@reduxjs/toolkit';
import { requestDemoStart, requestDemoSuccess, requestDemoFailure } from './landingSlice';
import { joinWaitlistStart, joinWaitlistSuccess, joinWaitlistFailure } from './landingSlice';

interface DemoRequestData {
  name: string;
  email: string;
  company: string;
  message: string;
}

interface WaitlistData {
  email: string;
  name?: string;
  company?: string;
}

// Demo Request Thunk
export const requestDemo = createAsyncThunk(
  'landing/requestDemo',
  async (data: DemoRequestData, { dispatch }) => {
    try {
      dispatch(requestDemoStart());

      const response = await fetch('/api/request-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send demo request');
      }

      dispatch(requestDemoSuccess());
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch(requestDemoFailure(errorMessage));
      throw error;
    }
  },
);

// Join Waitlist Thunk
export const joinWaitlist = createAsyncThunk(
  'landing/joinWaitlist',
  async (data: WaitlistData, { dispatch }) => {
    try {
      dispatch(joinWaitlistStart());

      // First, create contact in Resend
      const contactResponse = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!contactResponse.ok) {
        const errorData = await contactResponse.json();
        throw new Error(errorData.error || 'Failed to join waitlist');
      }

      dispatch(joinWaitlistSuccess());
      return await contactResponse.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch(joinWaitlistFailure(errorMessage));
      throw error;
    }
  },
);
