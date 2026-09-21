/**
 * NotFoundPage Component
 * 
 * 404 error page displayed when users navigate to nonexistent routes.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container" style={{ paddingBlock: '6rem', textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-icon" style={{ width: '80px', height: '80px' }}>
          <Compass size={40} color="var(--accent-tech)" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800 }}>
          404 - Page Not Found
        </h1>
        <p className="empty-desc">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Top Stories</span>
        </Link>
      </div>
    </div>
  );
}
