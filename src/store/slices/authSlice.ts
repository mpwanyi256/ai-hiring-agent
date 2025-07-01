import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase, UserRole } from '@/lib/supabase';

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

// Async thunks for authentication
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }) => {
    // Sign up user with metadata
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          company_name: userData.companyName,
        },
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('User creation failed');
    }

    // The trigger will automatically create the profile and company
    // We'll return basic user info for now since the user needs to confirm email first
    return {
      id: data.user.id,
      email: data.user.email!,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'recruiter' as UserRole,
      companyId: '',
      companyName: userData.companyName,
      companySlug: '',
      subscription: null,
      usageCounts: {
        activeJobs: 0,
        interviewsThisMonth: 0,
      },
      createdAt: data.user.created_at,
    };
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) throw error;

    // Fetch user data from the comprehensive user_details view
    const { data: userDetails, error: userError } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    return {
      id: userDetails.id,
      email: userDetails.email,
      firstName: userDetails.first_name,
      lastName: userDetails.last_name,
      role: userDetails.role,
      companyId: userDetails.company_id || '',
      companyName: userDetails.company_name || '',
      companySlug: userDetails.company_slug || '',
      subscription: userDetails.subscription_id ? {
        id: userDetails.subscription_id,
        name: userDetails.subscription_name,
        maxJobs: userDetails.max_jobs,
        maxInterviewsPerMonth: userDetails.max_interviews_per_month,
        status: userDetails.subscription_status,
      } : null,
      usageCounts: {
        activeJobs: userDetails.active_jobs_count || 0,
        interviewsThisMonth: userDetails.interviews_this_month || 0,
      },
      createdAt: userDetails.user_created_at,
    };
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;

  // Fetch user data from the comprehensive user_details view
  const { data: userDetails, error } = await supabase
    .from('user_details')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;

  return {
    id: userDetails.id,
    email: userDetails.email,
    firstName: userDetails.first_name,
    lastName: userDetails.last_name,
    role: userDetails.role,
    companyId: userDetails.company_id || '',
    companyName: userDetails.company_name || '',
    companySlug: userDetails.company_slug || '',
    subscription: userDetails.subscription_id ? {
      id: userDetails.subscription_id,
      name: userDetails.subscription_name,
      maxJobs: userDetails.max_jobs,
      maxInterviewsPerMonth: userDetails.max_interviews_per_month,
      status: userDetails.subscription_status,
    } : null,
    usageCounts: {
      activeJobs: userDetails.active_jobs_count || 0,
      interviewsThisMonth: userDetails.interviews_this_month || 0,
    },
    createdAt: userDetails.user_created_at,
  };
});

// Function to refresh user data (useful after creating jobs or completing interviews)
export const refreshUserData = createAsyncThunk('auth/refreshUserData', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) throw new Error('No active session');

  const { data: userDetails, error } = await supabase
    .from('user_details')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;

  return {
    id: userDetails.id,
    email: userDetails.email,
    firstName: userDetails.first_name,
    lastName: userDetails.last_name,
    role: userDetails.role,
    companyId: userDetails.company_id || '',
    companyName: userDetails.company_name || '',
    companySlug: userDetails.company_slug || '',
    subscription: userDetails.subscription_id ? {
      id: userDetails.subscription_id,
      name: userDetails.subscription_name,
      maxJobs: userDetails.max_jobs,
      maxInterviewsPerMonth: userDetails.max_interviews_per_month,
      status: userDetails.subscription_status,
    } : null,
    usageCounts: {
      activeJobs: userDetails.active_jobs_count || 0,
      interviewsThisMonth: userDetails.interviews_this_month || 0,
    },
    createdAt: userDetails.user_created_at,
  };
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
        state.isAuthenticated = true;
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
        state.error = action.error.message || 'Sign in failed';
      })
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      // Refresh User Data
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;

export default authSlice.reducer; 