/**
 * SearchBar Component
 * 
 * Keyword input with category dropdown and keyboard shortcuts.
 * Automatically pushes query parameters to the /search route.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

export default function SearchBar({ initialQuery = '', initialCategory = '', onSearch }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanQ = query.trim();

    if (onSearch) {
      onSearch(cleanQ, category);
    } else {
      const params = new URLSearchParams();
      if (cleanQ) params.set('q', cleanQ);
      if (category && category !== 'all') params.set('category', category);
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
          placeholder="Search headlines, artificial intelligence, Premier League, NBA..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {query && (
          <button 
            type="button" 
            onClick={handleClear} 
            className="btn btn-icon btn-ghost btn-sm"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        <select
          className="search-category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by Category"
        >
          <option value="all">All Topics</option>
          <option value="technology">Technology</option>
          <option value="sports">Sports</option>
        </select>

        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
      </form>
    </div>
  );
}
