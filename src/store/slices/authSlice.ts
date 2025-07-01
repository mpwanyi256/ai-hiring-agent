import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  tier: 'free' | 'pro' | 'premium';
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
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) throw error;

    // Create employer record
    const { data: employer, error: employerError } = await supabase
      .from('employers')
      .insert({
        id: data.user!.id,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        company_name: userData.companyName,
        tier: 'free',
      })
      .select()
      .single();

    if (employerError) throw employerError;

    return {
      id: employer.id,
      email: employer.email,
      firstName: employer.first_name,
      lastName: employer.last_name,
      companyName: employer.company_name,
      tier: employer.tier,
      createdAt: employer.created_at,
    };
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) throw error;

    // Fetch employer data
    const { data: employer, error: employerError } = await supabase
      .from('employers')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (employerError) throw employerError;

    return {
      id: employer.id,
      email: employer.email,
      firstName: employer.first_name,
      lastName: employer.last_name,
      companyName: employer.company_name,
      tier: employer.tier,
      createdAt: employer.created_at,
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

  const { data: employer, error } = await supabase
    .from('employers')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) throw error;

  return {
    id: employer.id,
    email: employer.email,
    firstName: employer.first_name,
    lastName: employer.last_name,
    companyName: employer.company_name,
    tier: employer.tier,
    createdAt: employer.created_at,
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
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer; 