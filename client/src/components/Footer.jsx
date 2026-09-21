/**
 * Footer Component
 * 
 * Provides subtle branding and application meta information.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img 
            src="/anews-circle-logo.png" 
            alt="ANEWS Logo" 
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              A<span style={{ color: '#ef4444' }}>NEWS</span>
            </span>
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              NEWS BEYOND BORDERS
            </span>
          </div>
          <span className="footer-text" style={{ marginLeft: '0.5rem' }}>
            • Live News Intelligence
          </span>
        </div>

        <p className="footer-text" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          Powered by Express, MySQL, React & NewsAPI.org
        </p>

        <div className="footer-links">
          <Link to="/" className="footer-link">Top Stories</Link>
          <Link to="/tech" className="footer-link">Technology</Link>
          <Link to="/sports" className="footer-link">Sports</Link>
          <Link to="/saved" className="footer-link">Bookmarks</Link>
        </div>
      </div>
    </footer>
  );
}
