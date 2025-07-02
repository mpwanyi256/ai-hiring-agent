import axios from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 10000,
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
  }
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
    
    return Promise.reject(error);
  }
);

// Utility functions for common API patterns
export const apiUtils = {
  // GET request helper
  get: <T = any>(url: string, config?: any) => 
    api.get<T>(url, config).then(response => response.data),
  
  // POST request helper
  post: <T = any>(url: string, data?: any, config?: any) => 
    api.post<T>(url, data, config).then(response => response.data),
  
  // PUT request helper
  put: <T = any>(url: string, data?: any, config?: any) => 
    api.put<T>(url, data, config).then(response => response.data),
  
  // DELETE request helper
  delete: <T = any>(url: string, config?: any) => 
    api.delete<T>(url, config).then(response => response.data),
  
  // PATCH request helper
  patch: <T = any>(url: string, data?: any, config?: any) => 
    api.patch<T>(url, data, config).then(response => response.data),
};

export default api; 