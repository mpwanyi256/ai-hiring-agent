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

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface EmailNotConfirmedError {
  type: 'EMAIL_NOT_CONFIRMED';
  email: string;
  message: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ProfileResponse {
  profile: unknown;
}

export interface CheckAuthResponse {
  isAuthenticated: boolean;
  user: User;
}

export interface VerifyOtpResponse {
  user: User;
}

export interface ResendOtpResponse {
  message: string;
}
