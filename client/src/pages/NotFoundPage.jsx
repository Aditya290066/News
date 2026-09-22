/**
 * NotFoundPage Component - Editorial 404
 * 
 * Displayed when users navigate to nonexistent routes with editorial links
 * back to primary categories.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass, ArrowLeft, Home, Search, Cpu, Trophy } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ paddingBlock: '5rem', textAlign: 'center' }}>
      <Helmet>
        <title>404 — Story Not Found | ANEWS</title>
        <meta name="description" content="The page or story you requested could not be found." />
      </Helmet>

      <div className="empty-state" style={{ maxWidth: '600px', marginInline: 'auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--brand-red-light)',
          color: 'var(--brand-red)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <Compass size={32} />
        </div>

        <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-red)' }}>
          404 Error · Page Unavailable
        </span>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 800, marginBlock: '0.5rem 1rem' }}>
          This page cannot be found
        </h1>

        <p className="empty-desc" style={{ marginBottom: '2rem' }}>
          The headline, category, or archive report you are searching for might have been updated, relocated, or is temporarily offline.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <Link to="/" className="btn btn-primary" style={{ background: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}>
            <Home size={16} />
            <span>Return to Top Stories</span>
          </Link>

          <Link to="/search" className="btn btn-secondary">
            <Search size={16} />
            <span>Search Wire</span>
          </Link>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
            BROWSE MAJOR SECTIONS
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.88rem', fontWeight: 600 }}>
            <Link to="/tech" style={{ color: 'var(--text-secondary)' }}>Technology</Link>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <Link to="/business" style={{ color: 'var(--text-secondary)' }}>Business</Link>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <Link to="/sports" style={{ color: 'var(--text-secondary)' }}>Sports</Link>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <Link to="/world" style={{ color: 'var(--text-secondary)' }}>World</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
