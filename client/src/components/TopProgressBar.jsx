/**
 * TopProgressBar Component
 * 
 * Editorial YouTube/GitHub-style slim progress bar at the top of the viewport
 * that animates during route transitions and asynchronous data loading.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function TopProgressBar({ loading = false }) {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Trigger on route transitions
  useEffect(() => {
    setVisible(true);
    setProgress(35);
    const t1 = setTimeout(() => setProgress(75), 100);
    const t2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setVisible(false), 250);
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname, location.search]);

  // Also respond to manual loading states
  useEffect(() => {
    if (loading) {
      setVisible(true);
      setProgress(40);
      const t = setTimeout(() => setProgress(80), 200);
      return () => clearTimeout(t);
    } else if (visible && progress < 100) {
      setProgress(100);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="top-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div 
        className="top-progress-bar-fill" 
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }} 
      />
    </div>
  );
}
