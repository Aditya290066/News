/**
 * SearchBar Component
 * 
 * Clean keyword input with submit and clear actions.
 * Automatically pushes query parameter to the /search route.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

export default function SearchBar({ initialQuery = '', onSearch }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanQ = query.trim();

    if (onSearch) {
      onSearch(cleanQ);
    } else {
      const params = new URLSearchParams();
      if (cleanQ) params.set('q', cleanQ);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="search-bar-wrap">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-icon-box">
          <Search size={18} />
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search headlines, technology, sports, business..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {query && (
          <button 
            type="button" 
            onClick={handleClear} 
            className="btn btn-icon btn-ghost btn-sm"
            style={{ color: 'var(--text-muted)', padding: '0.25rem' }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        <button type="submit" className="btn btn-primary btn-sm search-submit-btn">
          Search
        </button>
      </form>
    </div>
  );
}
