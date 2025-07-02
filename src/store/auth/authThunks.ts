import { createAsyncThunk } from '@reduxjs/toolkit';
import { SignUpData, SignInData, EmailNotConfirmedError } from '@/types';
import { apiUtils } from '../api';

// Async thunks for authentication using API routes with axios
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: SignUpData) => {
    try {
      const response = await apiUtils.post('/api/auth/signup', userData);
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Sign up failed');
    }
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: SignInData, { rejectWithValue }) => {
    try {
      const response = await apiUtils.post('/api/auth/signin', credentials);
      return response.user;
    } catch (error: any) {
      const errorData = error.response?.data;
      
      // Check if it's an email not confirmed error
      if (errorData?.error === 'EMAIL_NOT_CONFIRMED') {
        return rejectWithValue({
          type: 'EMAIL_NOT_CONFIRMED',
          email: errorData.email,
          message: errorData.message
        } as EmailNotConfirmedError);
      }
      
      throw new Error(errorData?.error || 'Sign in failed');
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  try {
    await apiUtils.post('/api/auth/signout');
    return true;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Sign out failed');
  }
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  try {
    const response = await apiUtils.get('/api/auth/check');
    return response.isAuthenticated ? response.user : null;
  } catch (error: any) {
    throw new Error('Failed to check authentication');
  }
});

// Function to refresh user data (useful after creating jobs or completing interviews)
export const refreshUserData = createAsyncThunk('auth/refreshUserData', async () => {
  try {
    const response = await apiUtils.get('/api/auth/check');
    
    if (!response.isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    return response.user;
  } catch (error: any) {
    throw new Error('Failed to refresh user data');
  }
});

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, token }: { email: string; token: string }) => {
    try {
      const response = await apiUtils.post('/api/auth/verify-otp', { email, token });
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'OTP verification failed');
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (email: string) => {
    try {
      const response = await apiUtils.post('/api/auth/resend-otp', { email });
      return response.message;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to resend OTP');
    }
  }
); 