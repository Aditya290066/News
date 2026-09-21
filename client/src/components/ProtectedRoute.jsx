/**
 * Protected Route Guard
 * 
 * Enforces authentication for private views such as Saved Articles.
 * Redirects unauthenticated users to /login and preserves their intended target route.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
