import { apiError } from '@/lib/notification';
import axios, { AxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 60000, // Upto 1 minute
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens or other global headers
api.interceptors.request.use(
  (config) => {
    // Add any global request headers here
    // For example, auth tokens could be added here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors here
    if (error.response?.status === 401) {
      // Handle unauthorized errors
      console.warn('Unauthorized request detected');
    }

    if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error detected');
    }

    // request timeout
    if (error.code === 'ERR_NETWORK') {
      apiError('Request took longer than expected. Please try again.');
      console.error('Request timeout detected');
    }

    return Promise.reject(error);
  },
);

// Utility functions for common API patterns
export const apiUtils = {
  // GET request helper
  get: <T = unknown>(url: string, config?: unknown) =>
    api.get<T>(url, config as AxiosRequestConfig).then((response) => response.data),

  // POST request helper
  post: <T = unknown>(url: string, data?: unknown, config?: unknown) =>
    api.post<T>(url, data, config as AxiosRequestConfig).then((response) => response.data),

  // PUT request helper
  put: <T = unknown>(url: string, data?: unknown, config?: unknown) =>
    api.put<T>(url, data, config as AxiosRequestConfig).then((response) => response.data),

  // DELETE request helper
  delete: <T = unknown>(url: string, config?: unknown) =>
    api.delete<T>(url, config as AxiosRequestConfig).then((response) => response.data),

  // PATCH request helper
  patch: <T = unknown>(url: string, data?: unknown, config?: unknown) =>
    api.patch<T>(url, data, config as AxiosRequestConfig).then((response) => response.data),
};

export default api;
