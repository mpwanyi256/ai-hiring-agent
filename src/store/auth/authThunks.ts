import { createAsyncThunk } from '@reduxjs/toolkit';
import { SignUpData, SignInData, EmailNotConfirmedError } from '@/types';
import { apiUtils } from '../api';

// Response type interfaces
interface AuthResponse {
  user: unknown;
  token?: string;
}

interface LoginResponse {
  user: unknown;
  token: string;
}

interface ProfileResponse {
  profile: unknown;
}

interface CheckAuthResponse {
  isAuthenticated: boolean;
  user: unknown;
}

interface VerifyOtpResponse {
  user: unknown;
}

interface ResendOtpResponse {
  message: string;
}

// Async thunks for authentication using API routes with axios
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    try {
      const response = await apiUtils.post<AuthResponse>('/api/auth/signup', userData);
      return response.user;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }) => {
    try {
      const response = await apiUtils.post<LoginResponse>('/api/auth/signin', credentials);
      return response;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign in failed');
    }
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  try {
    await apiUtils.post('/api/auth/signout');
    return null;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Sign out failed');
  }
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  try {
    const response = await apiUtils.get<AuthResponse>('/api/auth/me');
    return response.user;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get current user');
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { firstName: string; lastName: string; company?: string; role?: string }) => {
    try {
      const response = await apiUtils.put<ProfileResponse>('/api/auth/profile', profileData);
      return response.profile;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  },
);

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  try {
    const response = await apiUtils.get<CheckAuthResponse>('/api/auth/check');
    return response.isAuthenticated ? response.user : null;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to check authentication');
  }
});

// Function to refresh user data (useful after creating jobs or completing interviews)
export const refreshUserData = createAsyncThunk('auth/refreshUserData', async () => {
  try {
    const response = await apiUtils.get<CheckAuthResponse>('/api/auth/check');

    if (!response.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    return response.user;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to refresh user data');
  }
});

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, token }: { email: string; token: string }) => {
    try {
      const response = await apiUtils.post<VerifyOtpResponse>('/api/auth/verify-otp', {
        email,
        token,
      });
      return response.user;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'OTP verification failed');
    }
  },
);

export const resendOtp = createAsyncThunk('auth/resendOtp', async (email: string) => {
  try {
    const response = await apiUtils.post<ResendOtpResponse>('/api/auth/resend-otp', { email });
    return response.message;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to resend OTP');
  }
});
