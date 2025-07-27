import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  SignUpData,
  User,
  SignInData,
  AuthResponse,
  LoginResponse,
  ProfileResponse,
  CheckAuthResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
  CompanyNameValidationData,
  CompanyNameValidationResponse,
} from '@/types/auth';
import { apiUtils } from '../api';

// Async thunks for authentication using API routes with axios
export const signUp = createAsyncThunk<User, SignUpData>(
  'auth/signUp',
  async ({ email, password, firstName, lastName, companyName }: SignUpData) => {
    try {
      const response = await apiUtils.post<AuthResponse>('/api/auth/signup', {
        email,
        password,
        firstName,
        lastName,
        companyName,
      });
      return response.user;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign up failed');
    }
  },
);

export const signIn = createAsyncThunk<User, SignInData>(
  'auth/signIn',
  async ({ email, password }: SignInData, { rejectWithValue }) => {
    try {
      const response = await apiUtils.post<LoginResponse>('/api/auth/signin', {
        email,
        password,
      });
      return response.user;
    } catch (error: unknown) {
      // Check if it's an axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const responseData = axiosError.response?.data;

        // Handle EMAIL_NOT_CONFIRMED error specifically
        if (responseData?.error === 'EMAIL_NOT_CONFIRMED') {
          return rejectWithValue({
            type: 'EMAIL_NOT_CONFIRMED',
            email: responseData.email,
            message: responseData.message || 'Email not confirmed',
          });
        }
      }

      return rejectWithValue(error);
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

// Company name validation thunk
export const validateCompanyName = createAsyncThunk<
  CompanyNameValidationResponse,
  CompanyNameValidationData
>('auth/validateCompanyName', async ({ companyName }: CompanyNameValidationData) => {
  try {
    const response = await apiUtils.post<CompanyNameValidationResponse>(
      '/api/auth/validate-company-name',
      {
        companyName,
      },
    );
    return response;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Company name validation failed');
  }
});
