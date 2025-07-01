import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserRole } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  companySlug: string;
  subscription: {
    id: string;
    name: string;
    maxJobs: number;
    maxInterviewsPerMonth: number;
    status: string;
  } | null;
  usageCounts: {
    activeJobs: number;
    interviewsThisMonth: number;
  };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

// Async thunks for authentication using API routes
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Sign up failed');
    }

    return data.user;
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // Check if it's an email not confirmed error
      if (data.error === 'EMAIL_NOT_CONFIRMED') {
        return rejectWithValue({
          type: 'EMAIL_NOT_CONFIRMED',
          email: data.email,
          message: data.message
        });
      }
      throw new Error(data.error || 'Sign in failed');
    }

    return data.user;
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const response = await fetch('/api/auth/signout', {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Sign out failed');
  }

  return true;
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const response = await fetch('/api/auth/check', {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to check authentication');
  }

  return data.isAuthenticated ? data.user : null;
});

// Function to refresh user data (useful after creating jobs or completing interviews)
export const refreshUserData = createAsyncThunk('auth/refreshUserData', async () => {
  const response = await fetch('/api/auth/check', {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok || !data.isAuthenticated) {
    throw new Error('Failed to refresh user data');
  }

  return data.user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = false; // User needs to verify email first
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Sign up failed';
      })
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        // Don't set error for EMAIL_NOT_CONFIRMED - let component handle redirect
        if (action.payload && typeof action.payload === 'object' && 'type' in action.payload && action.payload.type === 'EMAIL_NOT_CONFIRMED') {
          return; // Don't set error, component will handle redirect
        }
        state.error = action.error.message || 'Sign in failed';
      })
      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
      })
      .addCase(signOut.rejected, (state) => {
        state.isLoading = false;
        // Even if sign out fails, clear the state
        state.user = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        // Only show loading if we don't have a user yet
        if (!state.user) {
          state.isLoading = true;
        }
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Refresh User Data
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setLoading, clearAuth } = authSlice.actions;

export default authSlice.reducer; 