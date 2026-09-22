/**
 * LoadingSkeleton Component
 * 
 * Content-matched skeleton loaders for all major layout areas:
 * - Hero lead story skeleton
 * - Secondary stories skeleton
 * - Sidebar trending & ticker skeletons
 * - Section rails skeleton
 * - Article detail skeleton
 */

import React from 'react';

export function HeroSkeleton() {
  return (
    <div className="hero-story-card" aria-hidden="true">
      <div className="skeleton-editorial-hero" />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div className="skeleton-line" style={{ width: '80px', height: '14px' }} />
        <div className="skeleton-line" style={{ width: '100px', height: '14px' }} />
      </div>
      <div className="skeleton-headline-large" />
      <div className="skeleton-headline-large" style={{ width: '70%', height: '32px' }} />
      <div className="skeleton-line" style={{ width: '95%', height: '16px' }} />
      <div className="skeleton-line" style={{ width: '85%', height: '16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="skeleton-line" style={{ width: '120px', height: '14px' }} />
        <div className="skeleton-line" style={{ width: '80px', height: '14px' }} />
      </div>
    </div>
  );
}

export function SecondarySkeleton({ count = 3 }) {
  return (
    <div className="secondary-stories-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="secondary-card">
          <div className="skeleton" style={{ aspectRatio: '16/10', width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
          <div className="skeleton-line" style={{ width: '60px', height: '12px' }} />
          <div className="skeleton-line" style={{ width: '90%', height: '18px', marginTop: '0.3rem' }} />
          <div className="skeleton-line" style={{ width: '70%', height: '18px' }} />
          <div className="skeleton-line" style={{ width: '100px', height: '12px', marginTop: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="editorial-sidebar" aria-hidden="true">
      <div className="skeleton-line" style={{ width: '140px', height: '20px', marginBottom: '1rem' }} />
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="skeleton" style={{ width: '28px', height: '32px', borderRadius: '3px' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-line" style={{ width: '95%', height: '16px' }} />
            <div className="skeleton-line" style={{ width: '65%', height: '14px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RailSkeleton({ count = 4 }) {
  return (
    <div className="section-rail" aria-hidden="true" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
        <div className="skeleton-line" style={{ width: '180px', height: '24px' }} />
        <div className="skeleton-line" style={{ width: '100px', height: '16px' }} />
      </div>
      <div className="section-rail-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton skeleton-image" />
            <div className="skeleton-body">
              <div className="skeleton-line" style={{ width: '70px', height: '14px' }} />
              <div className="skeleton-line" style={{ width: '90%', height: '18px' }} />
              <div className="skeleton-line" style={{ width: '60%', height: '18px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="article-detail-container" aria-hidden="true">
      <div className="skeleton-line" style={{ width: '120px', height: '16px', marginBottom: '1.5rem' }} />
      <div className="skeleton-line" style={{ width: '90px', height: '14px', marginBottom: '0.5rem' }} />
      <div className="skeleton-headline-large" style={{ height: '42px', width: '95%' }} />
      <div className="skeleton-headline-large" style={{ height: '36px', width: '75%' }} />
      <div className="skeleton-line" style={{ width: '100%', height: '20px', marginTop: '1rem' }} />
      <div className="skeleton-line" style={{ width: '90%', height: '20px' }} />
      <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: '4px', marginBlock: '1.5rem' }} />
      <div className="skeleton-line" style={{ width: '100%', height: '18px' }} />
      <div className="skeleton-line" style={{ width: '98%', height: '18px' }} />
      <div className="skeleton-line" style={{ width: '92%', height: '18px' }} />
      <div className="skeleton-line" style={{ width: '85%', height: '18px' }} />
    </div>
  );
}

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="news-grid" aria-busy="true" aria-label="Loading news articles">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton skeleton-image" />
          <div className="skeleton-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div className="skeleton" style={{ width: '80px', height: '16px', borderRadius: '2px' }} />
              <div className="skeleton" style={{ width: '50px', height: '16px', borderRadius: '2px' }} />
            </div>
            <div className="skeleton" style={{ width: '90%', height: '20px', marginBottom: '0.4rem' }} />
            <div className="skeleton" style={{ width: '65%', height: '20px', marginBottom: '0.8rem' }} />
            <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.3rem' }} />
            <div className="skeleton" style={{ width: '95%', height: '14px', marginBottom: '0.3rem' }} />
            <div className="skeleton" style={{ width: '80%', height: '14px' }} />
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="skeleton" style={{ width: '90px', height: '14px' }} />
              <div className="skeleton" style={{ width: '50px', height: '14px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
