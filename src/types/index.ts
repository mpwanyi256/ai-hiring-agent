// Export all auth types
export * from './auth';

// Export all job types
export * from './jobs';

// Export all candidate types
export * from './candidates';

// Export all common types
export * from './common'; 

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
