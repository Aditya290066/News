/**
 * Loading Skeleton Component
 * 
 * Shimmer placeholder cards matching the news grid layout to prevent
 * Cumulative Layout Shifts (CLS) while data is loading.
 */

import React from 'react';

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="news-grid" aria-busy="true" aria-label="Loading news articles">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          {/* Image skeleton */}
          <div className="skeleton skeleton-image" />

          {/* Body skeleton */}
          <div className="skeleton-body">
            {/* Tag and date row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '50px', height: '18px', borderRadius: '4px' }} />
            </div>

            {/* Title lines */}
            <div className="skeleton" style={{ width: '90%', height: '22px', marginBottom: '0.4rem' }} />
            <div className="skeleton" style={{ width: '65%', height: '22px', marginBottom: '0.8rem' }} />

            {/* Description lines */}
            <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.3rem' }} />
            <div className="skeleton" style={{ width: '95%', height: '14px', marginBottom: '0.3rem' }} />
            <div className="skeleton" style={{ width: '80%', height: '14px' }} />

            {/* Footer row */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ width: '90px', height: '16px' }} />
              <div className="skeleton" style={{ width: '60px', height: '16px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
