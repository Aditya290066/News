/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a graceful editorial fallback UI instead of
 * blanking the entire application.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught runtime UI exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingBlock: '4rem', textAlign: 'center' }}>
          <div className="empty-state" style={{ maxWidth: '560px', marginInline: 'auto' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'var(--brand-red-light)', 
              color: 'var(--brand-red)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Something went wrong loading this section
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Our editorial desk encountered an unexpected client error rendering this report. You can reload the page or return to Top Stories.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={this.handleReset} 
                className="btn btn-primary"
                style={{ background: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <a href="/" className="btn btn-secondary">
                <Home size={15} />
                <span>Return to Top Stories</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
