import { createAsyncThunk } from '@reduxjs/toolkit';
import { requestDemoStart, requestDemoSuccess, requestDemoFailure } from './landingSlice';
import { joinWaitlistStart, joinWaitlistSuccess, joinWaitlistFailure } from './landingSlice';

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  subject: string;
  message: string;
}

interface WaitlistData {
  email: string;
  name?: string;
  company?: string;
}

// Contact Form Thunk (formerly requestDemo)
export const submitContactForm = createAsyncThunk(
  'landing/submitContactForm',
  async (data: ContactFormData, { dispatch }) => {
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
        throw new Error(errorData.error || 'Failed to send contact form');
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

// Backward compatibility export
export const requestDemo = submitContactForm;

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
