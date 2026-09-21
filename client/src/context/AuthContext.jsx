/**
 * Authentication Context
 * 
 * Manages user authentication state, token persistence in localStorage,
 * and user session verification.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('news_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('news_token'));
  const [loading, setLoading] = useState(true);

  // Validate session on app launch if token exists
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get('/auth/me');
        if (response.data.status === 'success') {
          setUser(response.data.user);
          localStorage.setItem('news_user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.warn('Session verification failed, logging out.');
        logout();
      } finally {
        setLoading(false);
      }
    }

    verifySession();

    // Listen for session expiry from axios interceptor
    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [token]);

  /**
   * Logs in with email and password
   */
  const login = async (email, password) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('news_token', receivedToken);
    localStorage.setItem('news_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return response.data;
  };

  /**
   * Registers a new account
   */
  const register = async (name, email, password) => {
    const response = await axiosClient.post('/auth/register', { name, email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('news_token', receivedToken);
    localStorage.setItem('news_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return response.data;
  };

  /**
   * Logs out current user and clears storage
   */
  const logout = () => {
    localStorage.removeItem('news_token');
    localStorage.removeItem('news_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
