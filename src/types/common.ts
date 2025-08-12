// Common API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

// Common state interfaces
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// API status types
export type ApiStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// Pagination types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// Generic async thunk state
export interface AsyncThunkState {
  status: ApiStatus;
  error: string | null;
}
