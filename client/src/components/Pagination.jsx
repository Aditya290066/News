/**
 * Pagination Component
 * 
 * Provides clean previous/next controls and page navigation.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalResults = 0,
  pageSize = 12,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination-wrap" aria-label="News Page Navigation">
      <button
        className="page-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </button>

      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingInline: '0.75rem' }}>
        Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        className="page-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next Page"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
