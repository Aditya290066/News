/**
 * Configured Axios Client Instance
 * 
 * Automatically attaches JWT Bearer token to request headers and handles
 * 401 Unauthorized errors by redirecting to login.
 */

import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT token if stored
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('news_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global 401 Unauthorized responses
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      
      if (!isAuthRoute) {
        // Clear cached credentials
        localStorage.removeItem('news_token');
        localStorage.removeItem('news_user');
        
        // Dispatch global event for auth state listeners
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
